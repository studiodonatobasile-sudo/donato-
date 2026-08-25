import { DEFAULT_SUBCATEGORY, type SubcategoryId } from '../types'

// Parole chiave in italiano per il riscontro automatico della sottocategoria di spesa.
// L'ordine conta: la prima sottocategoria con una corrispondenza vince (raggruppate per
// macro-categoria, nello stesso ordine di SUBCATEGORIES).
const KEYWORDS: { subcategory: Exclude<SubcategoryId, 'altro-varie'>; words: string[] }[] = [
  { subcategory: 'alimentari-supermercato', words: ['supermercato', 'super', 'esselunga', 'conad', 'coop', 'carrefour', 'lidl', 'eurospin', 'pam', 'penny', 'iper', 'md discount'] },
  { subcategory: 'alimentari-fruttaverdura', words: ['frutta', 'verdura', 'fruttivendolo', 'ortofrutta'] },
  { subcategory: 'alimentari-panetteria', words: ['pane', 'panetteria', 'panificio', 'forno', 'pasticceria'] },
  { subcategory: 'alimentari-macelleria', words: ['macelleria', 'macellaio', 'pescheria', 'salumeria'] },
  { subcategory: 'alimentari-mercato', words: ['mercato', 'alimentari'] },
  { subcategory: 'alimentari-consegna', words: ['consegna spesa', 'spesa online', 'spesa a domicilio', 'everli'] },

  { subcategory: 'trasporti-carburante', words: ['benzina', 'diesel', 'gasolio', 'carburante', 'distributore', 'agip', 'eni', 'q8'] },
  { subcategory: 'trasporti-autostrada', words: ['autostrada', 'pedaggio', 'telepass'] },
  { subcategory: 'trasporti-pubblici', words: ['treno', 'trenitalia', 'italo', 'bus', 'autobus', 'metro', 'metropolitana', 'tram', 'biglietto treno', 'biglietto bus', 'abbonamento mezzi', 'abbonamento bus'] },
  { subcategory: 'trasporti-taxi', words: ['taxi', 'uber', 'ncc'] },
  { subcategory: 'trasporti-parcheggio', words: ['parcheggio', 'parchimetro', 'parcometro', 'garage'] },
  { subcategory: 'trasporti-manutenzione', words: ['officina', 'meccanico', 'gommista', 'gomme', 'revisione', 'tagliando'] },
  { subcategory: 'trasporti-assicurazione', words: ['assicurazione auto', 'rc auto', 'bollo auto', 'bollo moto', 'assicurazione moto'] },
  { subcategory: 'trasporti-noleggio', words: ['noleggio auto', 'noleggio scooter', 'car sharing'] },

  { subcategory: 'casa-affitto', words: ['affitto', 'mutuo', 'canone', 'affittanza'] },
  { subcategory: 'casa-elettricita', words: ['luce', 'enel', 'elettricità', 'energia elettrica'] },
  { subcategory: 'casa-gas', words: ['gas', 'riscaldamento', 'metano', 'gpl'] },
  { subcategory: 'casa-acqua', words: ['acqua', 'immondizia', 'tari', 'spazzatura', 'rifiuti'] },
  { subcategory: 'casa-internet', words: ['internet', 'telefono', 'fibra', 'wifi', 'adsl', 'cellulare'] },
  { subcategory: 'casa-condominio', words: ['condominio', 'amministratore'] },
  { subcategory: 'casa-manutenzione', words: ['idraulico', 'elettricista', 'ferramenta', 'traslochi', 'imbianchino'] },
  { subcategory: 'casa-arredamento', words: ['arredamento', 'ikea', 'mobili', 'elettrodomestici'] },

  { subcategory: 'salute-farmacia', words: ['farmacia', 'farmaco', 'farmaci', 'medicine', 'parafarmacia'] },
  { subcategory: 'salute-visite', words: ['medico', 'dottore', 'dottoressa', 'visita medica', 'visita', 'ambulatorio'] },
  { subcategory: 'salute-dentista', words: ['dentista', 'odontoiatra', 'ortodonzia'] },
  { subcategory: 'salute-analisi', words: ['analisi', 'esami del sangue', 'laboratorio analisi', 'ospedale', 'ticket'] },
  { subcategory: 'salute-occhiali', words: ['occhiali', 'ottico', 'lenti a contatto'] },
  { subcategory: 'salute-fisioterapia', words: ['fisioterapia', 'fisioterapista', 'osteopata'] },
  { subcategory: 'salute-veterinario', words: ['veterinario', 'clinica veterinaria'] },

  { subcategory: 'svago-ristorante', words: ['ristorante', 'pizzeria', 'trattoria', 'pizza', 'osteria'] },
  { subcategory: 'svago-bar', words: ['bar', 'aperitivo', 'gelato', 'gelateria', 'caffè', 'caffetteria'] },
  { subcategory: 'svago-cinema', words: ['cinema', 'teatro', 'museo'] },
  { subcategory: 'svago-streaming', words: ['netflix', 'spotify', 'disney', 'prime video', 'abbonamento streaming'] },
  { subcategory: 'svago-palestra', words: ['palestra', 'piscina', 'sport', 'corso sportivo'] },
  { subcategory: 'svago-viaggi', words: ['viaggio', 'vacanza', 'hotel', 'albergo', 'gita', 'volo', 'airbnb'] },
  { subcategory: 'svago-hobby', words: ['libro', 'libreria', 'videogioco', 'videogiochi', 'hobby'] },
  { subcategory: 'svago-eventi', words: ['concerto', 'evento', 'biglietto concerto', 'parco divertimenti'] },

  { subcategory: 'abbigliamento-vestiti', words: ['vestiti', 'abbigliamento', 'zara', 'h&m', 'hm', 'oviesse', 'camicia', 'pantaloni', 'giacca', 'maglione', 'felpa'] },
  { subcategory: 'abbigliamento-scarpe', words: ['scarpe', 'scarpe da ginnastica', 'calzature'] },
  { subcategory: 'abbigliamento-accessori', words: ['borsa', 'cintura', 'gioielli', 'accessori moda'] },
  { subcategory: 'abbigliamento-intimo', words: ['intimo', 'biancheria intima'] },

  { subcategory: 'istruzione-scuola', words: ['scuola', 'libri scolastici', 'materiale scolastico', 'cancelleria', 'zaino scuola'] },
  { subcategory: 'istruzione-asilo', words: ['asilo', 'nido', 'baby sitter', 'babysitter'] },
  { subcategory: 'istruzione-corsi', words: ['corso', 'ripetizioni', 'lezioni private'] },
  { subcategory: 'istruzione-giocattoli', words: ['giocattoli', 'giocattolo', 'giochi bambini'] },
  { subcategory: 'istruzione-infanzia', words: ['pannolini', 'latte in polvere', 'omogeneizzati', 'passeggino'] },
  { subcategory: 'istruzione-universita', words: ['università', 'tasse universitarie', 'retta universitaria'] },

  { subcategory: 'altro-regali', words: ['regalo', 'regali'] },
  { subcategory: 'altro-beneficenza', words: ['beneficenza', 'donazione', 'offerta'] },
  { subcategory: 'altro-multe', words: ['multa', 'sanzione', 'contravvenzione'] },
  { subcategory: 'altro-tabacchi', words: ['tabacchi', 'sigarette', 'tabaccheria'] },
  { subcategory: 'altro-bancarie', words: ['commissione bancaria', 'spese bancarie', 'bollo conto'] }
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Riconosce automaticamente la sottocategoria di spesa a partire dalla descrizione. */
export function classifyCategory(description: string): SubcategoryId {
  const text = normalize(description)
  if (!text) return DEFAULT_SUBCATEGORY
  for (const { subcategory, words } of KEYWORDS) {
    if (words.some((w) => text.includes(normalize(w)))) {
      return subcategory
    }
  }
  // "Spesa" da sola è troppo generica per essere una parola chiave di prima scelta (è anche
  // il termine italiano per "expense"): la usiamo solo come ultima risorsa, dopo aver escluso
  // corrispondenze più specifiche in tutte le altre sottocategorie.
  if (text.includes('spesa')) return 'alimentari-mercato'
  return DEFAULT_SUBCATEGORY
}
