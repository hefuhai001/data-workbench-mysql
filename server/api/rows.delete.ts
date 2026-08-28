// 删除指定行：接收 { database, table, idCols, idVals, connectionId? }，通过主键列(支持复合主键)定位并 DELETE，
// WHERE 反引号转义、值参数绑定，用于数据网格的"删除行"。
export default defineEventHandler(async (event) => {
  const { database, table, idCols, idVals, connectionId } = await readBody(event)
  if (!database || !table || !Array.isArray(idCols) || !Array.isArray(idVals) || idCols.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '缺参数' })
  }
  const safeTable = esc(table)
  try {
    const { target } = connectionId ? await targetFor(connectionId) : await currentTarget()
    target.database = database
    const conn = await openMysql(target)
    try {
      const whereSql = idCols.map(k => `\`${esc(k)}\` = ?`).join(' AND ')
      await conn.query(`DELETE FROM \`${safeTable}\` WHERE ${whereSql}`, idVals)
      return { ok: true }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? 400, statusMessage: e?.message || String(e) })
  }
})