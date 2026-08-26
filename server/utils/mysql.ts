import { createConnection, type Connection, type ConnectionConfig } from 'mysql2/promise'

export interface MysqlTarget {
  host: string
  port: number
  user: string
  password: string
  database?: string
}

export async function openMysql(cfg: MysqlTarget): Promise<Connection> {
  const connConfig: ConnectionConfig = {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database || undefined,
    connectTimeout: 8000,
    multipleStatements: true
  }
  return createConnection(connConfig)
}

export async function testConnection(cfg: MysqlTarget): Promise<{ ok: boolean; message: string }> {
  let conn: Connection | null = null
  try {
    conn = await openMysql(cfg)
    await conn.ping()
    return { ok: true, message: '连接成功' }
  } catch (e: unknown) {
    const err = e as Error
    return { ok: false, message: err?.message || String(e) }
  } finally {
    if (conn) await conn.end().catch(() => {})
  }
}