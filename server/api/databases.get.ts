// 枚举当前连接的数据库列表：从 information_schema.schemata 查询，过滤掉 MySQL 系统库，
// 供对象浏览器左侧树展示。建立短连接，用完即关闭。
export default defineEventHandler(async () => {
  try {
    return await withConnection(async (conn) => {
      const [rows] = await conn.query(
        `SELECT schema_name AS name FROM information_schema.schemata
         WHERE schema_name NOT IN ('information_schema','mysql','performance_schema','sys')
         ORDER BY schema_name`)
      return rows
    })
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