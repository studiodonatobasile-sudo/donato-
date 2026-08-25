import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AppSettings, Expense } from './types'
import { DEFAULT_SETTINGS } from './types'

interface ExpensesDB extends DBSchema {
  expenses: {
    key: string
    value: Expense
    indexes: { 'by-date': string }
  }
  settings: {
    key: string
    value: AppSettings
  }
}

const DB_NAME = 'spese-familiari-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ExpensesDB>> | null = null

function getDb(): Promise<IDBPDatabase<ExpensesDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ExpensesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('expenses')) {
          const store = db.createObjectStore('expenses', { keyPath: 'id' })
          store.createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }
  return dbPromise
}

export async function getAllExpenses(): Promise<Expense[]> {
  const db = await getDb()
  return db.getAll('expenses')
}

export async function saveExpense(expense: Expense): Promise<void> {
  const db = await getDb()
  await db.put('expenses', expense)
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('expenses', id)
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb()
  const s = await db.get('settings', 'settings')
  return s ?? DEFAULT_SETTINGS
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb()
  await db.put('settings', settings)
}
