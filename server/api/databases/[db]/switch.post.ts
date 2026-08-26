// 将当前连接切换到指定数据库：建立短连接后 changeUser 校验目标库可用性（后续连接为一次性，实际切换在为每次请求重建连接时生效）。
export default defineEventHandler(async (event) => {
  const dbName = getRouterParam(event, 'db')
  try {
    const { target } = await currentTarget()
    target.database = dbName
    const conn = await openMysql(target)
    try {
      await conn.changeUser({ database: dbName })
      return { ok: true }
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