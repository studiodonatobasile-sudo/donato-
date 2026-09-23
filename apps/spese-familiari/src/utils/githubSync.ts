import { resolveCategory, type Expense, type SubcategoryDef } from '../types'

// Repository PRIVATO dedicato alla coda di sincronizzazione (mai il repository pubblico del
// sito, che è visibile a chiunque su internet: scriverci dati di spesa li renderebbe pubblici).
const REPO_OWNER = 'studiodonatobasile-sudo'
const REPO_NAME = 'spese-familiari-sync-privato'
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

/** Accoda una spesa per la sincronizzazione automatica giornaliera verso il foglio Drive.
 * Scrive/aggiorna un file JSON per giornata nel repository (letto ed elaborato una volta al
 * giorno). Operazione "best effort": chi chiama deve gestire eventuali errori senza bloccare
 * il salvataggio locale della spesa, che resta comunque la fonte di verità in IndexedDB. */
export async function pushExpenseToSyncQueue(expense: Expense, token: string, customCategories: SubcategoryDef[]): Promise<void> {
  const path = `${QUEUE_PATH_PREFIX}/${expense.date}.json`

  const getRes = await githubRequest(`contents/${path}`, token)
  let sha: string | undefined
  let queue: QueuedExpense[] = []
  if (getRes.ok) {
    const data = (await getRes.json()) as { sha: string; content: string }
    sha = data.sha
    queue = JSON.parse(decodeBase64Utf8(data.content)) as QueuedExpense[]
  } else if (getRes.status !== 404) {
    throw new Error(`Lettura coda GitHub fallita (${getRes.status})`)
  }

  if (queue.some((q) => q.id === expense.id)) return

  queue.push({
    id: expense.id,
    date: expense.date,
    description: expense.member ? `${expense.description} — ${expense.member}` : expense.description,
    amount: expense.amount,
    excelCategory: mapToExcelCategory(expense.category, customCategories)
  })

  const putRes = await githubRequest(`contents/${path}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Coda sync spese: ${expense.date}`,
      content: encodeBase64Utf8(JSON.stringify(queue, null, 2)),
      ...(sha ? { sha } : {})
    })
  })
  if (!putRes.ok) throw new Error(`Scrittura coda GitHub fallita (${putRes.status})`)
}
