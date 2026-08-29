import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), '.data')
try {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
} catch (e) {
  throw new Error(`无法创建数据目录 ${dataDir}，请确认容器用户有写权限（可设置 DATA_DIR 环境变量重定向）：${e instanceof Error ? e.message : String(e)}`)
}
const dbPath = path.join(dataDir, 'workbench.db')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS app_master (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    masterPasswordHash TEXT NOT NULL,
    masterSalt TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    user TEXT NOT NULL,
    defaultDatabase TEXT,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS notes (
    key TEXT PRIMARY KEY,
    note TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export const sqlite = db
export type AppMasterRow = { masterPasswordHash: string; masterSalt: string }