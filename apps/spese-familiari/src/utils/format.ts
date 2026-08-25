export function formatCurrency(amount: number): string {
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}
