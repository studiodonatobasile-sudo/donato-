import { resolveCategory, type Expense, type SubcategoryDef } from '../types'

// Repository PRIVATO dedicato alla coda di sincronizzazione (mai il repository pubblico del
// sito, che è visibile a chiunque su internet: scriverci dati di spesa li renderebbe pubblici).
const REPO_OWNER = 'studiodonatobasile-sudo'
const REPO_NAME = 'spese-familiari-sync--privato'
const QUEUE_PATH_PREFIX = 'sync-queue'

/** Eccezioni di mappatura per sottocategoria specifica, quando la macro-categoria da sola
 * non basta a scegliere la categoria giusta nel foglio Excel (es. affitto vs. utenze). */
const EXCEL_CATEGORY_BY_SUBCATEGORY: Record<string, string> = {
  'casa-affitto': 'Casa/Affitto/Mutuo'
}

/** Mappa le 8 macro-categorie dell'app alle 9 categorie del foglio "Spese Familiari" del file
 * Drive (menu a tendina già presente nel file: vedi data validation sulla colonna Categoria). */
const EXCEL_CATEGORY_BY_MACRO: Record<string, string> = {
  alimentari: 'Alimentari',
  trasporti: 'Trasporti',
  casa: 'Utenze Domestiche',
  salute: 'Salute',
  svago: 'Tempo Libero',
  abbigliamento: 'Altro',
  istruzione: 'Istruzione/Figli',
  altro: 'Altro'
}

export function mapToExcelCategory(categoryId: string, customCategories: SubcategoryDef[]): string {
  if (categoryId in EXCEL_CATEGORY_BY_SUBCATEGORY) return EXCEL_CATEGORY_BY_SUBCATEGORY[categoryId]
  const { macro } = resolveCategory(categoryId, customCategories)
  return EXCEL_CATEGORY_BY_MACRO[macro.id] ?? 'Altro'
}

interface QueuedExpense {
  id: string
  date: string
  description: string
  amount: number
  excelCategory: string
}

function encodeBase64Utf8(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

function decodeBase64Utf8(base64: string): string {
  return decodeURIComponent(escape(atob(base64.replace(/\n/g, ''))))
}

async function githubRequest(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...init?.headers
    }
  })
}

function describeHttpError(status: number): string {
  if (status === 401) return 'chiave non valida o scaduta: generane una nuova e incollala qui'
  if (status === 403) return 'la chiave non ha il permesso "Contents: Read and write"'
  if (status === 404) return `repository non trovato: la chiave deve includere "${REPO_NAME}"`
  return `errore GitHub ${status}`
}

async function queueExpensesForDate(date: string, expenses: Expense[], token: string, customCategories: SubcategoryDef[]): Promise<void> {
  const path = `${QUEUE_PATH_PREFIX}/${date}.json`

  const getRes = await githubRequest(`contents/${path}`, token)
  let sha: string | undefined
  let queue: QueuedExpense[] = []
  if (getRes.ok) {
    const data = (await getRes.json()) as { sha: string; content: string }
    sha = data.sha
    queue = JSON.parse(decodeBase64Utf8(data.content)) as QueuedExpense[]
  } else if (getRes.status !== 404) {
    throw new Error(describeHttpError(getRes.status))
  }

  const alreadyQueued = new Set(queue.map((q) => q.id))
  const toAdd = expenses.filter((e) => !alreadyQueued.has(e.id))
  if (toAdd.length === 0) return

  for (const e of toAdd) {
    queue.push({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      excelCategory: mapToExcelCategory(e.category, customCategories)
    })
  }

  const putRes = await githubRequest(`contents/${path}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Coda sync spese: ${date}`,
      content: encodeBase64Utf8(JSON.stringify(queue, null, 2)),
      ...(sha ? { sha } : {})
    })
  })
  if (!putRes.ok) throw new Error(describeHttpError(putRes.status))
}

/** Accoda nel repository privato le spese dal giorno di attivazione in poi non ancora inviate
 * (un file JSON per giornata, elaborato ogni notte verso il foglio Drive). Restituisce gli id
 * inviati e, se un invio fallisce, un messaggio leggibile: le spese non inviate restano da
 * inviare al tentativo successivo, e comunque salvate in locale in IndexedDB. */
export async function syncPendingExpenses(
  expenses: Expense[],
  token: string,
  startDate: string,
  syncedIds: string[],
  customCategories: SubcategoryDef[]
): Promise<{ sentIds: string[]; error: string | null }> {
  const synced = new Set(syncedIds)
  const byDate = new Map<string, Expense[]>()
  for (const e of expenses) {
    if (e.date < startDate || synced.has(e.id)) continue
    byDate.set(e.date, [...(byDate.get(e.date) ?? []), e])
  }

  const sentIds: string[] = []
  for (const [date, list] of byDate) {
    try {
      await queueExpensesForDate(date, list, token, customCategories)
    } catch (err) {
      const error = err instanceof TypeError ? 'nessuna connessione a internet' : err instanceof Error ? err.message : String(err)
      return { sentIds, error }
    }
    sentIds.push(...list.map((e) => e.id))
  }
  return { sentIds, error: null }
}
