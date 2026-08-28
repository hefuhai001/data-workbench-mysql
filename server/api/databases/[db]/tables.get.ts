// 枚举指定数据库下的表/视图列表：从 information_schema.tables 按表名排序查询，
// 元素含 name 与 type（BASE TABLE=表，其余为视图），用于对象浏览器展开数据库。
// connectionId 可选，缺省使用当前连接。
export default defineEventHandler(async (event) => {
  const dbName = getRouterParam(event, 'db')
  const query = getQuery<{ connectionId?: string }>(event)
  const connectionId = query.connectionId || undefined
  try {
    const { target } = connectionId ? await targetFor(connectionId) : await currentTarget()
    target.database = dbName
    const conn = await openMysql(target)
    try {
      const [rows] = await conn.query(
        `SELECT table_name AS name, table_type AS type FROM information_schema.tables
         WHERE table_schema = ? ORDER BY table_name`, [dbName])
      return rows
    } finally {
      conn.end().catch(() => {})
    }
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