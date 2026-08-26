import { currentTarget } from '../utils/connect'
import { openMysql } from '../utils/mysql'
import { esc } from '../utils/escape'

export default defineEventHandler(async (event) => {
  const { database, table, row } = await readBody(event)
  if (!database || !table || !row) throw createError({ statusCode: 400, statusMessage: '缺参数' })
  const safeTable = esc(table)
  try {
    const { target } = await currentTarget()
    target.database = database
    const conn = await openMysql(target)
    try {
      // 过滤空字符串值，让自增主键/默认值列由数据库自行处理
      const keys = Object.keys(row).filter(k => row[k] !== '')
      if (keys.length === 0) {
        await conn.query(`INSERT INTO \`${safeTable}\` () VALUES ()`)
      } else {
        const placeholders = keys.map(() => '?').join(', ')
        const cols = keys.map(k => `\`${esc(k)}\``).join(', ')
        await conn.query(`INSERT INTO \`${safeTable}\` (${cols}) VALUES (${placeholders})`, keys.map(k => row[k]))
      }
      return { ok: true }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? 400, statusMessage: e?.message || String(e) })
  }
})