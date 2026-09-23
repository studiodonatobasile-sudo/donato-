import { resolveCategory, type Expense, type SubcategoryDef } from '../types'
import { addDays, todayStr } from './dateUtils'

/** Prefisso del nome file: la trascrizione notturna cerca su Drive i file che iniziano così. */
export const DRIVE_EXPORT_PREFIX = 'spese-da-trascrivere'

/** Oltre alle spese mai inviate, si reinviano quelle degli ultimi giorni: chi trascrive scarta
 * gli id già presenti, e così un invio finito male (condivisione annullata, file non salvato)
 * viene recuperato da quello successivo. */
const RESEND_DAYS = 7

const EXCEL_CATEGORY_BY_SUBCATEGORY: Record<string, string> = {
  'casa-affitto': 'Casa/Affitto/Mutuo'
}

/** Le 8 macro-categorie dell'app sulle 9 categorie del foglio "Spese Familiari" del file Drive. */
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

function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function expensesToSend(expenses: Expense[], startDate: string, exportedIds: string[]): Expense[] {
  const exported = new Set(exportedIds)
  const resendFrom = addDays(todayStr(), -RESEND_DAYS)
  return expenses
    .filter((e) => e.date >= startDate && (!exported.has(e.id) || e.date >= resendFrom))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}

export function buildDriveExportFile(expenses: Expense[], customCategories: SubcategoryDef[]): File {
  const rows = [
    'id,data,descrizione,categoria,importo',
    ...expenses.map((e) =>
      [e.id, e.date, csvField(e.description), csvField(mapToExcelCategory(e.category, customCategories)), e.amount.toFixed(2)].join(',')
    )
  ]
  const now = new Date()
  const stamp = `${todayStr(now)}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  return new File([rows.join('\n') + '\n'], `${DRIVE_EXPORT_PREFIX}-${stamp}.csv`, { type: 'text/csv' })
}

/** Apre la condivisione del telefono con il file da salvare su Drive. Restituisce false se la
 * condivisione è stata annullata; se il browser non sa condividere file, scarica il file. */
export async function shareDriveExportFile(file: File): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      // Solo il file: con un titolo, la condivisione su iPhone salva anche un .txt con quel testo.
      await navigator.share({ files: [file] })
      return true
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false
      throw err
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
  return true
}
