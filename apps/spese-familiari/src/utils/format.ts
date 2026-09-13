export function formatCurrency(amount: number): string {
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

export function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

/** Toglie accenti e trattini tipografici (usati nelle etichette a schermo, es. "Lunedì" o gli
 * intervalli di date con un en dash) e li sostituisce con equivalenti ASCII: alcuni browser non
 * salvano correttamente il nome di un file scaricato se l'attributo download contiene caratteri
 * non ASCII, mostrando "download" invece del nome atteso. Da usare solo per i nomi file, mai per
 * il testo mostrato a schermo. */
export function sanitizeFilename(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‒-―−]/g, '-')
}
