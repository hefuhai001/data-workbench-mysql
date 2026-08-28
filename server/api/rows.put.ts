// 更新指定行：接收 { database, table, row, idCols, idVals, connectionId? }，通过主键列(idCols/idVals 数组，
// 支持复合主键)定位行，SET/WHERE 均反引号转义、值参数绑定，用于数据网格的"编辑行"。
export default defineEventHandler(async (event) => {
  const { database, table, row, idCols, idVals, connectionId } = await readBody(event)
  if (!database || !table || !row || !Array.isArray(idCols) || !Array.isArray(idVals) || idCols.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '缺参数' })
  }
  const safeTable = esc(table)
  try {
    const { target } = connectionId ? await targetFor(connectionId) : await currentTarget()
    target.database = database
    const conn = await openMysql(target)
    try {
      const setSql = Object.keys(row).map(k => `\`${esc(k)}\` = ?`).join(', ')
      const whereSql = idCols.map(k => `\`${esc(k)}\` = ?`).join(' AND ')
      await conn.query(`UPDATE \`${safeTable}\` SET ${setSql} WHERE ${whereSql}`, [...Object.values(row), ...idVals])
      return { ok: true }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? 400, statusMessage: e?.message || String(e) })
  }
})