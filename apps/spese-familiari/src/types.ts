export interface CategoryDef {
  id: string
  label: string
  icon: string
  /** Slot colore categoriale fisso (palette validata): l'ordine non va mai cambiato o ciclato. */
  colorVar: string
}

// Ordine fisso: e' anche l'ordine degli slot colore validati per contrasto/daltonismo.
// Non riordinare: il colore segue l'identita' della categoria, mai la sua posizione in classifica.
// Queste sono le "macro-categorie": determinano il colore nei grafici (che restano leggibili
// solo con poche serie). Le sottocategorie sotto sono la classificazione fine usata per
// l'annotazione e il riconoscimento automatico; ognuna appartiene a una sola macro-categoria.
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

export interface SubcategoryDef {
  id: string
  label: string
  macro: CategoryId
}

// Sottocategorie: classificazione fine per l'annotazione delle spese. Molte di più delle
// macro-categorie, per un riscontro automatico più preciso. Sono raggruppate per
// macro-categoria (nell'ordine di CATEGORIES) e ogni gruppo elenca le sue sottocategorie.
export const SUBCATEGORIES: SubcategoryDef[] = [
  { id: 'alimentari-supermercato', label: 'Supermercato', macro: 'alimentari' },
  { id: 'alimentari-fruttaverdura', label: 'Frutta e verdura', macro: 'alimentari' },
  { id: 'alimentari-panetteria', label: 'Panetteria e pasticceria', macro: 'alimentari' },
  { id: 'alimentari-macelleria', label: 'Macelleria e pescheria', macro: 'alimentari' },
  { id: 'alimentari-mercato', label: 'Mercato e alimentari', macro: 'alimentari' },
  { id: 'alimentari-consegna', label: 'Consegna spesa a domicilio', macro: 'alimentari' },

  { id: 'trasporti-carburante', label: 'Carburante', macro: 'trasporti' },
  { id: 'trasporti-autostrada', label: 'Autostrada e pedaggi', macro: 'trasporti' },
  { id: 'trasporti-pubblici', label: 'Mezzi pubblici', macro: 'trasporti' },
  { id: 'trasporti-taxi', label: 'Taxi e NCC', macro: 'trasporti' },
  { id: 'trasporti-parcheggio', label: 'Parcheggio', macro: 'trasporti' },
  { id: 'trasporti-manutenzione', label: 'Manutenzione veicolo', macro: 'trasporti' },
  { id: 'trasporti-assicurazione', label: 'Assicurazione veicolo', macro: 'trasporti' },
  { id: 'trasporti-noleggio', label: 'Noleggio veicoli', macro: 'trasporti' },

  { id: 'casa-affitto', label: 'Affitto o mutuo', macro: 'casa' },
  { id: 'casa-elettricita', label: 'Elettricità', macro: 'casa' },
  { id: 'casa-gas', label: 'Gas e riscaldamento', macro: 'casa' },
  { id: 'casa-acqua', label: 'Acqua e rifiuti', macro: 'casa' },
  { id: 'casa-internet', label: 'Internet e telefono', macro: 'casa' },
  { id: 'casa-condominio', label: 'Condominio', macro: 'casa' },
  { id: 'casa-manutenzione', label: 'Manutenzione casa', macro: 'casa' },
  { id: 'casa-arredamento', label: 'Arredamento ed elettrodomestici', macro: 'casa' },

  { id: 'salute-farmacia', label: 'Farmacia', macro: 'salute' },
  { id: 'salute-visite', label: 'Visite mediche', macro: 'salute' },
  { id: 'salute-dentista', label: 'Dentista', macro: 'salute' },
  { id: 'salute-analisi', label: 'Analisi ed esami', macro: 'salute' },
  { id: 'salute-occhiali', label: 'Occhiali e ottica', macro: 'salute' },
  { id: 'salute-fisioterapia', label: 'Fisioterapia', macro: 'salute' },
  { id: 'salute-veterinario', label: 'Veterinario', macro: 'salute' },

  { id: 'svago-ristorante', label: 'Ristoranti e pizzerie', macro: 'svago' },
  { id: 'svago-bar', label: 'Bar e caffè', macro: 'svago' },
  { id: 'svago-cinema', label: 'Cinema e teatro', macro: 'svago' },
  { id: 'svago-streaming', label: 'Abbonamenti streaming', macro: 'svago' },
  { id: 'svago-palestra', label: 'Palestra e sport', macro: 'svago' },
  { id: 'svago-viaggi', label: 'Viaggi e vacanze', macro: 'svago' },
  { id: 'svago-hobby', label: 'Hobby e libri', macro: 'svago' },
  { id: 'svago-eventi', label: 'Eventi e concerti', macro: 'svago' },

  { id: 'abbigliamento-vestiti', label: 'Vestiti', macro: 'abbigliamento' },
  { id: 'abbigliamento-scarpe', label: 'Scarpe', macro: 'abbigliamento' },
  { id: 'abbigliamento-accessori', label: 'Accessori', macro: 'abbigliamento' },
  { id: 'abbigliamento-intimo', label: 'Intimo', macro: 'abbigliamento' },

  { id: 'istruzione-scuola', label: 'Scuola e materiale scolastico', macro: 'istruzione' },
  { id: 'istruzione-asilo', label: 'Asilo e babysitter', macro: 'istruzione' },
  { id: 'istruzione-corsi', label: 'Corsi ed extra-scolastiche', macro: 'istruzione' },
  { id: 'istruzione-giocattoli', label: 'Giocattoli', macro: 'istruzione' },
  { id: 'istruzione-infanzia', label: "Prodotti per l'infanzia", macro: 'istruzione' },
  { id: 'istruzione-universita', label: 'Università', macro: 'istruzione' },

  { id: 'altro-regali', label: 'Regali', macro: 'altro' },
  { id: 'altro-beneficenza', label: 'Beneficenza', macro: 'altro' },
  { id: 'altro-multe', label: 'Multe e sanzioni', macro: 'altro' },
  { id: 'altro-tabacchi', label: 'Tabacchi', macro: 'altro' },
  { id: 'altro-bancarie', label: 'Spese bancarie e commissioni', macro: 'altro' },
  { id: 'altro-varie', label: 'Varie', macro: 'altro' }
] as const

export type SubcategoryId = (typeof SUBCATEGORIES)[number]['id']

export const DEFAULT_SUBCATEGORY: SubcategoryId = 'altro-varie'

/** Cerca una sottocategoria per id. Accetta anche id di macro-categoria (dati salvati prima
 * dell'introduzione delle sottocategorie), restituendo in quel caso undefined: usare insieme
 * a getCategoryForExpense per la risoluzione completa con fallback. */
export function findSubcategory(id: string): SubcategoryDef | undefined {
  return SUBCATEGORIES.find((s) => s.id === id)
}

export interface ResolvedCategory {
  subcategory: SubcategoryDef | null
  macro: CategoryDef
}

/** Risolve l'id di categoria salvato su una spesa (sottocategoria, o macro-categoria per i
 * dati salvati prima dell'introduzione delle sottocategorie) nella coppia sottocategoria/macro
 * da usare per etichetta e colore. */
export function resolveCategory(id: string): ResolvedCategory {
  const sub = findSubcategory(id)
  if (sub) return { subcategory: sub, macro: getCategory(sub.macro) }
  // Compatibilità con spese salvate quando esistevano solo le macro-categorie.
  return { subcategory: null, macro: getCategory(id) }
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
  /** Id di sottocategoria (vedi SUBCATEGORIES); può contenere un id di macro-categoria nei dati salvati prima dell'introduzione delle sottocategorie. */
  category: string
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
    category: DEFAULT_SUBCATEGORY,
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
