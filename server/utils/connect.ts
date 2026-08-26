import { assertUnlocked, session } from './session'
import { decryptSecret } from './crypto'
import { sqlite } from './db'
import { openMysql, type MysqlTarget } from './mysql'
import type { Connection } from 'mysql2/promise'

export async function currentTarget(): Promise<{ target: MysqlTarget; database: string | null }> {
  const key = assertUnlocked()
  if (!session.currentConnectionId) throw new Error('NO_CONNECTION')
  const row = sqlite.prepare('SELECT * FROM connections WHERE id = ?').get(session.currentConnectionId) as {
    host: string; port: number; user: string; defaultDatabase: string | null; ciphertext: string; iv: string
  } | undefined
  if (!row) throw new Error('CONN_NOT_FOUND')
  const password = decryptSecret({ ciphertext: row.ciphertext, iv: row.iv }, key)
  const target: MysqlTarget = {
    host: row.host, port: row.port, user: row.user, password,
    database: row.defaultDatabase || undefined
  }
  return { target, database: row.defaultDatabase || null }
}

export async function currentConnection(): Promise<Connection> {
  const { target } = await currentTarget()
  return openMysql(target)
}

export async function withConnection<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  const conn = await currentConnection()
  try {
    return await fn(conn)
  } finally {
    conn.end().catch(() => {})
  }
}