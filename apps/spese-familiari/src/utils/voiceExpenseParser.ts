export interface ParsedVoiceExpense {
  amount: number | null
  description: string
}

const FILLER_WORDS = [
  'ho speso', 'ho pagato', 'ho fatto', 'ho comprato', 'abbiamo speso', 'abbiamo pagato',
  'spesi', 'speso', 'spesa di', 'pagati', 'pagato', 'circa', 'euro', 'per', 'di', 'in', 'su',
  'da', 'e cinquanta centesimi', 'centesimi'
]

/**
 * Estrae importo e descrizione da una frase pronunciata a voce, ad es.:
 * "15 euro al supermercato" -> { amount: 15, description: "al supermercato" }
 * "ho speso 8,50 euro per la benzina" -> { amount: 8.5, description: "la benzina" }
 */
export function parseVoiceExpense(transcript: string): ParsedVoiceExpense {
  const text = transcript.trim()
  const match = text.match(/(\d+(?:[.,]\d{1,2})?)/)
  const amount = match ? Number(match[1].replace(',', '.')) : null

  let description = text
  if (match) {
    description = description.slice(0, match.index) + description.slice((match.index ?? 0) + match[0].length)
  }

  let normalized = description
  for (const filler of FILLER_WORDS) {
    normalized = normalized.replace(new RegExp(`\\b${filler}\\b`, 'gi'), ' ')
  }
  normalized = normalized.replace(/\s+/g, ' ').trim()
  normalized = normalized.replace(/^(al|allo|alla|ai|agli|alle|il|lo|la|i|gli|le|un|uno|una)\s+/i, '')
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1)

  return {
    amount: amount !== null && amount > 0 ? amount : null,
    description: normalized || 'Spesa generica'
  }
}
