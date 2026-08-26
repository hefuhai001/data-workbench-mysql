import { currentTarget } from '../utils/connect'
import { openMysql } from '../utils/mysql'
import { esc } from '../utils/escape'

export default defineEventHandler(async (event) => {
  const { database, table, row, idCols, idVals } = await readBody(event)
  if (!database || !table || !row || !Array.isArray(idCols) || !Array.isArray(idVals) || idCols.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '缺参数' })
  }
  const safeTable = esc(table)
  try {
    const { target } = await currentTarget()
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