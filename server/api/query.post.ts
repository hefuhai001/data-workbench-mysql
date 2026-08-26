import { currentTarget } from '../utils/connect'
import { openMysql } from '../utils/mysql'
import type { ResultSetHeader } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const { sql, database } = await readBody(event)
  if (!sql || typeof sql !== 'string') throw createError({ statusCode: 400, statusMessage: '缺 SQL' })
  try {
    const { target } = await currentTarget()
    if (database) target.database = database
    const conn = await openMysql(target)
    try {
      const [result] = await conn.query(sql)
      if (Array.isArray(result)) {
        return { type: 'select', rows: result, rowCount: (result as any[]).length }
      }
      const header = result as ResultSetHeader
      return { type: 'affect', affectedRows: header.affectedRows, insertId: header.insertId }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e?.sqlMessage || e?.message || String(e) })
  }
})