import type { ResultSetHeader } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const { sql, database } = await readBody(event)
  if (!sql || typeof sql !== 'string') throw createError({ statusCode: 400, statusMessage: '缺 SQL' })
  try {
    const { target } = await currentTarget()
    if (database) target.database = database
    const conn = await openMysql(target)
    try {
      const raw = (await conn.query(sql)) as unknown[]
      let rs: any = raw[0]
      // 多语句结果会嵌套（数组的数组），仅取首个结果集展示避免结构错乱
      if (Array.isArray(rs) && rs.length && Array.isArray(rs[0])) rs = rs[0]
      if (Array.isArray(rs)) {
        return { type: 'select', rows: rs, rowCount: rs.length }
      }
      const header = rs as ResultSetHeader
      return { type: 'affect', affectedRows: header.affectedRows, insertId: header.insertId }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    if (e?.message === 'NO_CONNECTION' || e?.message === 'CONN_NOT_FOUND') {
      throw createError({ statusCode: 400, statusMessage: e.message })
    }
    throw createError({
      statusCode: e?.statusCode ?? (e?.errno !== undefined ? 400 : 500),
      statusMessage: e?.sqlMessage || e?.message || String(e)
    })
  }
})