import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const testDbPath = path.join(process.cwd(), 'data', 'test', 'test.db')

describe('Database', () => {
  let db: Database.Database

  beforeAll(() => {
    const dir = path.dirname(testDbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(testDbPath)
    db.pragma('journal_mode = WAL')
  })

  afterAll(() => {
    db.close()
    try { fs.rmSync(path.dirname(testDbPath), { recursive: true, force: true }) } catch { /* ignore */ }
  })

  it('should create tables', () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'idle'
      )
    `)
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
    expect(tables.some(t => t.name === 'agents')).toBe(true)
  })

  it('should insert and read data', () => {
    db.prepare('INSERT INTO agents (id, name, role) VALUES (?, ?, ?)').run('test-1', 'Test Agent', 'sales')
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get('test-1') as { name: string; role: string }
    expect(agent.name).toBe('Test Agent')
    expect(agent.role).toBe('sales')
  })

  it('should handle transactions', () => {
    const insertMany = db.transaction(() => {
      db.prepare('INSERT INTO agents (id, name, role) VALUES (?, ?, ?)').run('test-2', 'Agent 2', 'finance')
      db.prepare('INSERT INTO agents (id, name, role) VALUES (?, ?, ?)').run('test-3', 'Agent 3', 'inventory')
    })
    insertMany()
    const count = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number }).c
    expect(count).toBe(3)
  })
})
