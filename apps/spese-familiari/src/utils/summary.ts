import { CATEGORIES, resolveCategory, type CategoryId, type Expense } from '../types'
import {
  addDays,
  daysBetweenInclusive,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek
} from './dateUtils'

export interface CategoryTotal {
  id: CategoryId
  total: number
  count: number
}

export interface DayPoint {
  date: string
  total: number
}

export interface Range {
  start: string
  end: string
  days: string[]
}

export function rangeForDay(dateStr: string): Range {
  return { start: dateStr, end: dateStr, days: [dateStr] }
}

export function rangeForWeek(dateStr: string): Range {
  const start = startOfWeek(dateStr)
  const end = endOfWeek(dateStr)
  return { start, end, days: daysBetweenInclusive(start, end) }
}

export function rangeForMonth(dateStr: string): Range {
  const start = startOfMonth(dateStr)
  const end = endOfMonth(dateStr)
  return { start, end, days: daysBetweenInclusive(start, end) }
}

export function previousRange(range: Range): Range {
  const spanDays = range.days.length
  const prevEnd = addDays(range.start, -1)
  const prevStart = addDays(prevEnd, -(spanDays - 1))
  return { start: prevStart, end: prevEnd, days: daysBetweenInclusive(prevStart, prevEnd) }
}

export function inRange(expense: Expense, range: Range): boolean {
  return expense.date >= range.start && expense.date <= range.end
}

export function filterByRange(expenses: Expense[], range: Range): Expense[] {
  return expenses.filter((e) => inRange(e, range))
}

export function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0)
}

/** Totali per macro-categoria (le sottocategorie confluiscono nella loro macro-categoria per
 * restare leggibili nei grafici), ordinati per importo decrescente — il colore resta legato
 * all'id della macro-categoria, non alla posizione in classifica. */
export function byCategory(expenses: Expense[]): CategoryTotal[] {
  const map = new Map<CategoryId, CategoryTotal>()
  for (const cat of CATEGORIES) {
    map.set(cat.id, { id: cat.id, total: 0, count: 0 })
  }
  for (const e of expenses) {
    const { macro } = resolveCategory(e.category)
    const entry = map.get(macro.id as CategoryId)
    if (entry) {
      entry.total += e.amount
      entry.count += 1
    }
  }
  return Array.from(map.values())
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total)
}

export function byDay(expenses: Expense[], days: string[]): DayPoint[] {
  const map = new Map<string, number>()
  for (const d of days) map.set(d, 0)
  for (const e of expenses) {
    if (map.has(e.date)) map.set(e.date, (map.get(e.date) ?? 0) + e.amount)
  }
  return days.map((date) => ({ date, total: map.get(date) ?? 0 }))
}

/** Variazione percentuale rispetto al periodo precedente, null se non calcolabile. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return (current - previous) / previous
}
