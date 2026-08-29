import { createConnection, type Connection } from 'mysql2/promise'

export interface MysqlTarget {
  host: string
  port: number
  user: string
  password: string
  database?: string
}

export async function openMysql(cfg: MysqlTarget): Promise<Connection> {
  return createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database || undefined,
    connectTimeout: 8000,
    multipleStatements: true,
    // 避免 BIGINT 超安全整数(2^53)时丢失精度：BEIGINT/DECIMAL 一律返回字符串，
    // 保证超长主键（如雪花 id）能被精确读取并用于 UPDATE/DELETE 的 WHERE 定位
    supportBigNumbers: true,
    bigNumberStrings: true
  })
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