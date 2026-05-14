import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const DB_PATH = join(DATA_DIR, 'keypilot.db')

// Ensure data directory exists
mkdirSync(DATA_DIR, { recursive: true })

let db: SqlJsDatabase | null = null
let dbReady: Promise<void>

async function initDb() {
  // Initialize sql.js - specify WASM file location for Node.js
  const SQL = await initSqlJs({
    locateFile: (file: string) => join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  })

  // Try to load existing database
  if (existsSync(DB_PATH)) {
    try {
      const buffer = readFileSync(DB_PATH)
      db = new SQL.Database(buffer)
    } catch {
      db = new SQL.Database()
    }
  } else {
    db = new SQL.Database()
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS keys (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      key TEXT NOT NULL,
      baseUrl TEXT,
      models TEXT,
      enabled INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      lastUsedAt TEXT,
      usageCount INTEGER DEFAULT 0,
      usageCost REAL DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      messages TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS imageHistory (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      keyId TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS videoHistory (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      keyId TEXT NOT NULL,
      videoUrl TEXT NOT NULL,
      thumbnailUrl TEXT,
      duration INTEGER,
      createdAt TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS audioHistory (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      keyId TEXT NOT NULL,
      audioUrl TEXT NOT NULL,
      duration INTEGER,
      createdAt TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS musicHistory (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      keyId TEXT NOT NULL,
      musicUrl TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyId TEXT NOT NULL,
      date TEXT NOT NULL,
      requestCount INTEGER DEFAULT 0,
      tokenCount INTEGER DEFAULT 0,
      cost REAL DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  saveDb()
}

function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

function waitDb(): Promise<void> {
  return dbReady
}

// Initialize database
dbReady = initDb()

export interface APIKey {
  id: string
  provider: string
  name: string
  key: string
  baseUrl?: string
  models?: string[]
  enabled: boolean
  createdAt: string
  lastUsedAt?: string
  usageCount: number
  usageCost: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model: string
  provider: string
  keyId: string
  timestamp: string
  tokens?: number
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ImageGeneration {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  imageUrl: string
  createdAt: string
}

export interface VideoGeneration {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  createdAt: string
}

export interface AudioGeneration {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  audioUrl: string
  duration?: number
  createdAt: string
}

export interface MusicGeneration {
  id: string
  prompt: string
  model: string
  provider: string
  keyId: string
  musicUrl: string
  createdAt: string
}

export interface UsageRecord {
  keyId: string
  date: string
  requestCount: number
  tokenCount: number
  cost: number
}

export interface Settings {
  theme: 'dark' | 'light' | 'system'
  baseUrl?: string
  lastSync?: string
}

// Helper functions
function parseKey(row: any): APIKey {
  return {
    ...row,
    models: row.models ? JSON.parse(row.models) : undefined,
    enabled: Boolean(row.enabled),
  }
}

export const store = {
  keys: {
    getAll: async (): Promise<APIKey[]> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM keys')
      if (!results.length) return []
      return results[0].values.map((row: any) =>
        parseKey({
          id: row[0],
          provider: row[1],
          name: row[2],
          key: row[3],
          baseUrl: row[4],
          models: row[5],
          enabled: row[6],
          createdAt: row[7],
          lastUsedAt: row[8],
          usageCount: row[9],
          usageCost: row[10],
        })
      )
    },
    add: async (key: APIKey): Promise<APIKey> => {
      await waitDb()
      console.log('[DB] Adding key:', key)
      db!.run(
        `INSERT INTO keys (id, provider, name, key, baseUrl, models, enabled, createdAt, usageCount, usageCost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          key.id,
          key.provider,
          key.name,
          key.key,
          key.baseUrl || null,
          key.models ? JSON.stringify(key.models) : null,
          key.enabled ? 1 : 0,
          key.createdAt,
          key.usageCount,
          key.usageCost,
        ]
      )
      console.log('[DB] Key added, saving...')
      saveDb()
      console.log('[DB] Saved, verifying...')
      const results = db!.exec('SELECT id, name FROM keys')
      console.log('[DB] Keys after add:', results)
      return key
    },
    update: async (id: string, updates: Partial<APIKey>): Promise<APIKey | null> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM keys')
      if (!results.length) return null
      const existingRow = results[0].values.find((r: any) => r[0] === id)
      if (!existingRow) return null

      const existing = parseKey({
        id: existingRow[0],
        provider: existingRow[1],
        name: existingRow[2],
        key: existingRow[3],
        baseUrl: existingRow[4],
        models: existingRow[5],
        enabled: existingRow[6],
        createdAt: existingRow[7],
        lastUsedAt: existingRow[8],
        usageCount: existingRow[9],
        usageCost: existingRow[10],
      })

      const updated = { ...existing, ...updates }
      db!.exec(
        `UPDATE keys SET provider = '${updated.provider}', name = '${updated.name.replace(/'/g, "''")}', key = '${updated.key.replace(/'/g, "''")}', baseUrl = ${updated.baseUrl ? `'${updated.baseUrl}'` : 'NULL'}, models = ${updated.models ? `'${JSON.stringify(updated.models).replace(/'/g, "''")}'` : 'NULL'}, enabled = ${updated.enabled ? 1 : 0}, lastUsedAt = ${updated.lastUsedAt ? `'${updated.lastUsedAt}'` : 'NULL'}, usageCount = ${updated.usageCount}, usageCost = ${updated.usageCost} WHERE id = '${id}'`
      )
      saveDb()
      return updated
    },
    delete: async (id: string): Promise<boolean> => {
      await waitDb()
      console.log('[DB] Delete key called with:', id)
      // First check if key exists
      const beforeDelete = db!.exec('SELECT id, name FROM keys')
      console.log('[DB] Keys before delete:', beforeDelete)
      // Use exec to execute DELETE and get result
      const deleteResult = db!.exec(`DELETE FROM keys WHERE id = '${id}'`)
      console.log('[DB] Delete exec result:', deleteResult)
      // Verify by checking if key still exists
      const afterDelete = db!.exec('SELECT id, name FROM keys')
      console.log('[DB] Keys after delete:', afterDelete)
      const stillExists = afterDelete.length > 0 && afterDelete[0].values.some((row: any) => row[0] === id)
      console.log('[DB] Key still exists:', stillExists)
      saveDb()
      return !stillExists
    },
    getById: async (id: string): Promise<APIKey | null> => {
      await waitDb()
      console.log('[DB] getById called with:', id)
      const results = db!.exec('SELECT * FROM keys')
      console.log('[DB] All keys:', results)
      if (!results.length || !results[0].values.length) {
        console.log('[DB] No keys found')
        return null
      }
      // Find the key with matching id
      const keyRow = results[0].values.find((row: any) => row[0] === id)
      if (!keyRow) {
        console.log('[DB] Key not found in results')
        return null
      }
      return parseKey({
        id: keyRow[0],
        provider: keyRow[1],
        name: keyRow[2],
        key: keyRow[3],
        baseUrl: keyRow[4],
        models: keyRow[5],
        enabled: keyRow[6],
        createdAt: keyRow[7],
        lastUsedAt: keyRow[8],
        usageCount: keyRow[9],
        usageCost: keyRow[10],
      })
    },
  },

  conversations: {
    getAll: async (): Promise<Conversation[]> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM conversations ORDER BY updatedAt DESC')
      if (!results.length) return []
      return results[0].values.map((row: any) => ({
        id: row[0],
        title: row[1],
        messages: JSON.parse(row[2]),
        createdAt: row[3],
        updatedAt: row[4],
      }))
    },
    getById: async (id: string): Promise<Conversation | null> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM conversations')
      if (!results.length) return null
      const row = results[0].values.find((r: any) => r[0] === id)
      if (!row) return null
      return {
        id: row[0],
        title: row[1],
        messages: JSON.parse(row[2]),
        createdAt: row[3],
        updatedAt: row[4],
      }
    },
    add: async (conversation: Conversation): Promise<Conversation> => {
      await waitDb()
      db!.run(
        `INSERT INTO conversations (id, title, messages, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [
          conversation.id,
          conversation.title,
          JSON.stringify(conversation.messages),
          conversation.createdAt,
          conversation.updatedAt,
        ]
      )
      saveDb()
      return conversation
    },
    update: async (id: string, updates: Partial<Conversation>): Promise<Conversation | null> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM conversations')
      if (!results.length) return null
      const existingRow = results[0].values.find((r: any) => r[0] === id)
      if (!existingRow) return null

      const existing: Conversation = {
        id: existingRow[0] as string,
        title: existingRow[1] as string,
        messages: JSON.parse(existingRow[2] as string),
        createdAt: existingRow[3] as string,
        updatedAt: existingRow[4] as string,
      }

      const updated: Conversation = {
        ...existing,
        ...updates,
        messages: updates.messages !== undefined ? updates.messages : existing.messages,
      }

      db!.exec(
        `UPDATE conversations SET title = '${updated.title.replace(/'/g, "''")}', messages = '${JSON.stringify(updated.messages).replace(/'/g, "''")}', updatedAt = '${updated.updatedAt}' WHERE id = '${id}'`
      )
      saveDb()
      return updated
    },
    delete: async (id: string): Promise<boolean> => {
      await waitDb()
      db!.run('DELETE FROM conversations WHERE id = ?', [id])
      const changes = db!.getRowsModified()
      saveDb()
      return changes > 0
    },
  },

  imageHistory: {
    getAll: async (): Promise<ImageGeneration[]> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM imageHistory ORDER BY createdAt DESC')
      if (!results.length) return []
      return results[0].values.map((row: any) => ({
        id: row[0],
        prompt: row[1],
        model: row[2],
        provider: row[3],
        keyId: row[4],
        imageUrl: row[5],
        createdAt: row[6],
      }))
    },
    add: async (image: ImageGeneration): Promise<ImageGeneration> => {
      await waitDb()
      db!.run(
        `INSERT INTO imageHistory (id, prompt, model, provider, keyId, imageUrl, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [image.id, image.prompt, image.model, image.provider, image.keyId, image.imageUrl, image.createdAt]
      )
      saveDb()
      return image
    },
    delete: async (id: string): Promise<boolean> => {
      await waitDb()
      db!.run('DELETE FROM imageHistory WHERE id = ?', [id])
      const changes = db!.getRowsModified()
      saveDb()
      return changes > 0
    },
  },

  videoHistory: {
    getAll: async (): Promise<VideoGeneration[]> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM videoHistory ORDER BY createdAt DESC')
      if (!results.length) return []
      return results[0].values.map((row: any) => ({
        id: row[0],
        prompt: row[1],
        model: row[2],
        provider: row[3],
        keyId: row[4],
        videoUrl: row[5],
        thumbnailUrl: row[6],
        duration: row[7],
        createdAt: row[8],
      }))
    },
    add: async (video: VideoGeneration): Promise<VideoGeneration> => {
      await waitDb()
      db!.run(
        `INSERT INTO videoHistory (id, prompt, model, provider, keyId, videoUrl, thumbnailUrl, duration, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [video.id, video.prompt, video.model, video.provider, video.keyId, video.videoUrl, video.thumbnailUrl || null, video.duration || null, video.createdAt]
      )
      saveDb()
      return video
    },
    delete: async (id: string): Promise<boolean> => {
      await waitDb()
      db!.run('DELETE FROM videoHistory WHERE id = ?', [id])
      const changes = db!.getRowsModified()
      saveDb()
      return changes > 0
    },
  },

  audioHistory: {
    getAll: async (): Promise<AudioGeneration[]> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM audioHistory ORDER BY createdAt DESC')
      if (!results.length) return []
      return results[0].values.map((row: any) => ({
        id: row[0],
        prompt: row[1],
        model: row[2],
        provider: row[3],
        keyId: row[4],
        audioUrl: row[5],
        duration: row[6],
        createdAt: row[7],
      }))
    },
    add: async (audio: AudioGeneration): Promise<AudioGeneration> => {
      await waitDb()
      db!.run(
        `INSERT INTO audioHistory (id, prompt, model, provider, keyId, audioUrl, duration, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [audio.id, audio.prompt, audio.model, audio.provider, audio.keyId, audio.audioUrl, audio.duration || null, audio.createdAt]
      )
      saveDb()
      return audio
    },
    delete: async (id: string): Promise<boolean> => {
      await waitDb()
      db!.run('DELETE FROM audioHistory WHERE id = ?', [id])
      const changes = db!.getRowsModified()
      saveDb()
      return changes > 0
    },
  },

  musicHistory: {
    getAll: async (): Promise<MusicGeneration[]> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM musicHistory ORDER BY createdAt DESC')
      if (!results.length) return []
      return results[0].values.map((row: any) => ({
        id: row[0],
        prompt: row[1],
        model: row[2],
        provider: row[3],
        keyId: row[4],
        musicUrl: row[5],
        createdAt: row[6],
      }))
    },
    add: async (music: MusicGeneration): Promise<MusicGeneration> => {
      await waitDb()
      db!.run(
        `INSERT INTO musicHistory (id, prompt, model, provider, keyId, musicUrl, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [music.id, music.prompt, music.model, music.provider, music.keyId, music.musicUrl, music.createdAt]
      )
      saveDb()
      return music
    },
    delete: async (id: string): Promise<boolean> => {
      await waitDb()
      db!.run('DELETE FROM musicHistory WHERE id = ?', [id])
      const changes = db!.getRowsModified()
      saveDb()
      return changes > 0
    },
  },

  usage: {
    getAll: async (): Promise<UsageRecord[]> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM usage')
      if (!results.length) return []
      return results[0].values.map((row: any) => ({
        keyId: row[1],
        date: row[2],
        requestCount: row[3],
        tokenCount: row[4],
        cost: row[5],
      }))
    },
    add: async (record: UsageRecord): Promise<UsageRecord> => {
      await waitDb()
      db!.run(
        `INSERT INTO usage (keyId, date, requestCount, tokenCount, cost)
         VALUES (?, ?, ?, ?, ?)`,
        [record.keyId, record.date, record.requestCount, record.tokenCount, record.cost]
      )
      saveDb()
      return record
    },
    getByKeyId: async (keyId: string): Promise<UsageRecord[]> => {
      await waitDb()
      const results = db!.exec('SELECT * FROM usage WHERE keyId = ?', [keyId])
      if (!results.length) return []
      return results[0].values.map((row: any) => ({
        keyId: row[1],
        date: row[2],
        requestCount: row[3],
        tokenCount: row[4],
        cost: row[5],
      }))
    },
  },

  settings: {
    get: async (): Promise<Settings> => {
      await waitDb()
      const results = db!.exec('SELECT value FROM settings WHERE key = ?', ['settings'])
      if (!results.length || !results[0].values.length) return { theme: 'dark' }
      return JSON.parse(results[0].values[0][0] as string)
    },
    update: async (updates: Partial<Settings>): Promise<Settings> => {
      await waitDb()
      const results = db!.exec('SELECT value FROM settings WHERE key = ?', ['settings'])
      const current = results.length && results[0].values.length
        ? JSON.parse(results[0].values[0][0] as string)
        : { theme: 'dark' }
      const updated = { ...current, ...updates }
      db!.run(
        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        ['settings', JSON.stringify(updated)]
      )
      saveDb()
      return updated
    },
  },
}
