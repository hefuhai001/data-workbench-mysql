// SQL 控制台自动补全数据：返回当前连接数据库下的表名及其列名。
// ?database= 可选，缺省使用连接默认库；无默认库时返回数据库列表。connectionId 可选。
export default defineEventHandler(async (event) => {
  const query = getQuery<{ database?: string; connectionId?: string }>(event)
  const connectionId = query.connectionId || undefined
  try {
    const { target, database: defaultDb } = connectionId ? await targetFor(connectionId) : await currentTarget()
    const db = query.database || defaultDb || ''
    const conn = await openMysql(target)
    try {
      if (!db) {
        const [dbs] = await conn.query(
          `SELECT schema_name AS name FROM information_schema.schemata
           WHERE schema_name NOT IN ('information_schema','mysql','performance_schema','sys') ORDER BY schema_name`)
        return { databases: dbs as any[] }
      }
      const [tables] = await conn.query(
        `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name`, [db])
      const [cols] = await conn.query(
        `SELECT table_name AS t, column_name AS c FROM information_schema.columns
         WHERE table_schema = ? ORDER BY table_name, ordinal_position`, [db])
      const byTable = new Map<string, string[]>()
      for (const r of cols as any[]) {
        if (!byTable.has(r.t)) byTable.set(r.t, [])
        byTable.get(r.t)!.push(r.c)
      }
      return {
        database: db,
        tables: (tables as any[]).map(t => ({ name: t.name, columns: byTable.get(t.name) || [] }))
      }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    if (e?.message === 'NO_CONNECTION' || e?.message === 'CONN_NOT_FOUND') {
      throw createError({ statusCode: 400, statusMessage: e.message })
    }
    throw createError({
      statusCode: e?.statusCode ?? (e?.errno !== undefined ? 400 : 500),
      statusMessage: e?.message || String(e)
    })
  }
})
