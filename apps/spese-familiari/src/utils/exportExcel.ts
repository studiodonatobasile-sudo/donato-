import { getCategory, resolveCategory, type Expense, type SubcategoryDef } from '../types'
import { byCategory, sumAmount } from './summary'

interface ExpenseRow {
  Data: string
  Ora: string
  Descrizione: string
  Categoria: string
  Sottocategoria: string
  'Chi ha speso': string
  'Importo (€)': number
  Fonte: string
}

interface CategoryRow {
  Categoria: string
  'Importo (€)': number
  '% sul totale': number
  'N. spese': number
}

/**
 * Esporta un elenco di spese in un file Excel (.xlsx) con due fogli: le singole spese
 * ordinate per data, e il riepilogo per categoria. Il download parte subito nel browser,
 * senza passare da un server. La libreria che genera il file (pesante) viene caricata solo
 * al momento dell'export, non nel bundle principale dell'app.
 */
export async function exportExpensesToExcel(
  expenses: Expense[],
  filename: string,
  customCategories: SubcategoryDef[] = []
): Promise<void> {
  const XLSX = await import('xlsx')
  const sorted = [...expenses].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const total = sumAmount(sorted)

  const expenseRows: ExpenseRow[] = sorted.map((e) => {
    const { subcategory, macro } = resolveCategory(e.category, customCategories)
    return {
      Data: e.date,
      Ora: e.time,
      Descrizione: e.description,
      Categoria: macro.label,
      Sottocategoria: subcategory ? subcategory.label : macro.label,
      'Chi ha speso': e.member ?? '',
      'Importo (€)': e.amount,
      Fonte: e.source === 'voice' ? 'Voce' : 'Manuale'
    }
  })
  expenseRows.push({
    Data: '',
    Ora: '',
    Descrizione: '',
    Categoria: '',
    Sottocategoria: '',
    'Chi ha speso': 'Totale',
    'Importo (€)': total,
    Fonte: ''
  })

  const categoryRows: CategoryRow[] = byCategory(sorted, customCategories).map((c) => ({
    Categoria: getCategory(c.id).label,
    'Importo (€)': c.total,
    '% sul totale': total > 0 ? Math.round((c.total / total) * 1000) / 10 : 0,
    'N. spese': c.count
  }))

  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows)
  wsExpenses['!cols'] = [
    { wch: 11 },
    { wch: 6 },
    { wch: 32 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 12 },
    { wch: 9 }
  ]

  const wsCategories = XLSX.utils.json_to_sheet(categoryRows)
  wsCategories['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 13 }, { wch: 10 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, wsExpenses, 'Spese')
  XLSX.utils.book_append_sheet(workbook, wsCategories, 'Per categoria')

  XLSX.writeFile(workbook, filename)
}
