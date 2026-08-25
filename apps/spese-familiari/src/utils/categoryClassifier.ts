import type { CategoryId } from '../types'

// Parole chiave in italiano per il riscontro automatico della tipologia di spesa.
// L'ordine conta: la prima categoria con una corrispondenza vince.
const KEYWORDS: { category: Exclude<CategoryId, 'altro'>; words: string[] }[] = [
  {
    category: 'alimentari',
    words: [
      'spesa', 'supermercato', 'super', 'esselunga', 'conad', 'coop', 'carrefour', 'lidl',
      'eurospin', 'pam', 'penny', 'iper', 'pane', 'panetteria', 'panificio', 'macelleria',
      'macellaio', 'pescheria', 'frutta', 'verdura', 'fruttivendolo', 'alimentari', 'ortofrutta',
      'salumeria', 'forno', 'mercato'
    ]
  },
  {
    category: 'trasporti',
    words: [
      'benzina', 'diesel', 'gasolio', 'carburante', 'distributore', 'autostrada', 'pedaggio',
      'telepass', 'treno', 'trenitalia', 'italo', 'bus', 'autobus', 'metro', 'metropolitana',
      'tram', 'taxi', 'uber', 'parcheggio', 'parchimetro', 'parcometro', 'bollo auto',
      'assicurazione auto', 'rc auto', 'officina', 'meccanico', 'gommista', 'gomme',
      'revisione', 'noleggio auto', 'biglietto treno', 'biglietto bus'
    ]
  },
  {
    category: 'casa',
    words: [
      'affitto', 'mutuo', 'luce', 'enel', 'gas', 'energia', 'elettricità', 'bolletta',
      'condominio', 'internet', 'telefono', 'fibra', 'wifi', 'acqua', 'immondizia', 'tari',
      'spazzatura', 'arredamento', 'ikea', 'ferramenta', 'idraulico', 'elettricista',
      'traslochi', 'affittanza', 'canone'
    ]
  },
  {
    category: 'salute',
    words: [
      'farmacia', 'farmaco', 'farmaci', 'medicine', 'medico', 'dottore', 'dottoressa',
      'dentista', 'visita medica', 'visita', 'analisi', 'ospedale', 'ticket', 'occhiali',
      'ottico', 'fisioterapia', 'fisioterapista', 'veterinario', 'ambulatorio'
    ]
  },
  {
    category: 'svago',
    words: [
      'cinema', 'ristorante', 'pizzeria', 'trattoria', 'bar', 'aperitivo', 'pizza', 'gelato',
      'gelateria', 'teatro', 'concerto', 'netflix', 'spotify', 'disney', 'abbonamento streaming',
      'palestra', 'piscina', 'sport', 'viaggio', 'vacanza', 'hotel', 'albergo', 'gita',
      'videogioco', 'videogiochi', 'libro', 'libreria', 'museo', 'parco divertimenti'
    ]
  },
  {
    category: 'abbigliamento',
    words: [
      'vestiti', 'abbigliamento', 'scarpe', 'scarpe da ginnastica', 'zara', 'h&m', 'hm',
      'oviesse', 'camicia', 'pantaloni', 'giacca', 'maglione', 'felpa', 'calzature', 'intimo'
    ]
  },
  {
    category: 'istruzione',
    words: [
      'scuola', 'libri scolastici', 'asilo', 'nido', 'retta', 'università', 'tasse universitarie',
      'corso', 'ripetizioni', 'giocattoli', 'giocattolo', 'pannolini', 'latte in polvere',
      'baby sitter', 'babysitter', 'materiale scolastico', 'cancelleria', 'zaino scuola'
    ]
  }
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Riconosce automaticamente la categoria di spesa a partire dalla descrizione. */
export function classifyCategory(description: string): CategoryId {
  const text = normalize(description)
  if (!text) return 'altro'
  for (const { category, words } of KEYWORDS) {
    if (words.some((w) => text.includes(normalize(w)))) {
      return category
    }
  }
  return 'altro'
}
