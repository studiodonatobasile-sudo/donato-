export interface CategoryDef {
  id: string
  label: string
  icon: string
  /** Slot colore categoriale fisso (palette validata): l'ordine non va mai cambiato o ciclato. */
  colorVar: string
}

// Ordine fisso: e' anche l'ordine degli slot colore validati per contrasto/daltonismo.
// Non riordinare: il colore segue l'identita' della categoria, mai la sua posizione in classifica.
export const CATEGORIES: CategoryDef[] = [
  { id: 'alimentari', label: 'Alimentari', icon: '🛒', colorVar: '--series-1' },
  { id: 'trasporti', label: 'Trasporti', icon: '⛽', colorVar: '--series-2' },
  { id: 'casa', label: 'Casa e bollette', icon: '🏠', colorVar: '--series-3' },
  { id: 'salute', label: 'Salute', icon: '💊', colorVar: '--series-4' },
  { id: 'svago', label: 'Svago e tempo libero', icon: '🎬', colorVar: '--series-5' },
  { id: 'abbigliamento', label: 'Abbigliamento', icon: '👕', colorVar: '--series-6' },
  { id: 'istruzione', label: 'Istruzione e bambini', icon: '🎒', colorVar: '--series-7' },
  { id: 'altro', label: 'Altro', icon: '📦', colorVar: '--series-8' }
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export const DEFAULT_CATEGORY: CategoryId = 'altro'

export function getCategory(id: string): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

export type ExpenseSource = 'manual' | 'voice'

export interface Expense {
  id: string
  /** Data della spesa, YYYY-MM-DD */
  date: string
  /** Ora della spesa, HH:MM */
  time: string
  amount: number
  description: string
  category: CategoryId
  /** Chi in famiglia ha fatto la spesa, opzionale */
  member: string | null
  source: ExpenseSource
  createdAt: number
  updatedAt: number
}

export function createEmptyExpense(overrides: Partial<Expense> = {}): Expense {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    id: crypto.randomUUID(),
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    amount: 0,
    description: '',
    category: DEFAULT_CATEGORY,
    member: null,
    source: 'manual',
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
    ...overrides
  }
}

export type SummaryKind = 'daily' | 'weekly' | 'monthly'

export interface AppSettings {
  key: 'settings'
  /** Ora (0-23) a cui mostrare i riepiloghi automatici */
  summaryHour: number
  dailySummaryEnabled: boolean
  weeklySummaryEnabled: boolean
  monthlySummaryEnabled: boolean
  speakSummaryAloud: boolean
  notificationsRequested: boolean
  monthlyBudget: number | null
  familyMembers: string[]
  lastDailyShownDate: string | null
  lastWeeklyShownKey: string | null
  lastMonthlyShownKey: string | null
}

export const DEFAULT_SETTINGS: AppSettings = {
  key: 'settings',
  summaryHour: 21,
  dailySummaryEnabled: true,
  weeklySummaryEnabled: true,
  monthlySummaryEnabled: true,
  speakSummaryAloud: false,
  notificationsRequested: false,
  monthlyBudget: null,
  familyMembers: ['Famiglia'],
  lastDailyShownDate: null,
  lastWeeklyShownKey: null,
  lastMonthlyShownKey: null
}
