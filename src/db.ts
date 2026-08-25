import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AgendaItem, AppSettings } from './types'
import { DEFAULT_SETTINGS } from './types'

interface AgendaDB extends DBSchema {
  items: {
    key: string
    value: AgendaItem
    indexes: { 'by-date': string }
  }
  attachmentBlobs: {
    key: string
    value: Blob
  }
  voiceNoteBlobs: {
    key: string
    value: Blob
  }
  settings: {
    key: string
    value: AppSettings
  }
}

const DB_NAME = 'agenda-vocale-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<AgendaDB>> | null = null

function getDb(): Promise<IDBPDatabase<AgendaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AgendaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('items')) {
          const store = db.createObjectStore('items', { keyPath: 'id' })
          store.createIndex('by-date', 'date')
        }
        if (!db.objectStoreNames.contains('attachmentBlobs')) {
          db.createObjectStore('attachmentBlobs')
        }
        if (!db.objectStoreNames.contains('voiceNoteBlobs')) {
          db.createObjectStore('voiceNoteBlobs')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }
  return dbPromise
}

export async function getAllItems(): Promise<AgendaItem[]> {
  const db = await getDb()
  return db.getAll('items')
}

export async function saveItem(item: AgendaItem): Promise<void> {
  const db = await getDb()
  await db.put('items', item)
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDb()
  const item = await db.get('items', id)
  const tx = db.transaction(['items', 'attachmentBlobs', 'voiceNoteBlobs'], 'readwrite')
  await tx.objectStore('items').delete(id)
  if (item) {
    for (const att of item.attachments) {
      await tx.objectStore('attachmentBlobs').delete(att.id)
    }
    if (item.voiceNoteId) {
      await tx.objectStore('voiceNoteBlobs').delete(item.voiceNoteId)
    }
  }
  await tx.done
}

export async function saveAttachmentBlob(id: string, blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put('attachmentBlobs', blob, id)
}

export async function getAttachmentBlob(id: string): Promise<Blob | undefined> {
  const db = await getDb()
  return db.get('attachmentBlobs', id)
}

export async function deleteAttachmentBlob(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('attachmentBlobs', id)
}

export async function saveVoiceNoteBlob(id: string, blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put('voiceNoteBlobs', blob, id)
}

export async function getVoiceNoteBlob(id: string): Promise<Blob | undefined> {
  const db = await getDb()
  return db.get('voiceNoteBlobs', id)
}

export async function deleteVoiceNoteBlob(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('voiceNoteBlobs', id)
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
