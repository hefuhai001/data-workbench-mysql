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
      // 时间戳自动维护：updated_at 为空时自动刷新为当前时间；created_at 为空则不写库（保留原创建时间）。
      // 其余空串列也跳过，避免把 NULL 显示为空串后回写覆盖成 NULL
      const upd: Record<string, any> = { ...row }
      if ('updated_at' in upd && !upd.updated_at) upd.updated_at = new Date()
      const setKeys = Object.keys(upd).filter(k => upd[k] !== '')
      if (setKeys.length === 0) {
        return { ok: true }
      }
      const setSql = setKeys.map(k => `\`${esc(k)}\` = ?`).join(', ')
      const whereSql = idCols.map(k => `\`${esc(k)}\` = ?`).join(' AND ')
      await conn.query(`UPDATE \`${safeTable}\` SET ${setSql} WHERE ${whereSql}`, [...setKeys.map(k => upd[k]), ...idVals])
      return { ok: true }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? 400, statusMessage: e?.message || String(e) })
  }
})