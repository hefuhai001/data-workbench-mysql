import { currentTarget } from '../utils/connect'
import { openMysql } from '../utils/mysql'
import { esc } from '../utils/escape'

export default defineEventHandler(async (event) => {
  // GET 请求下 h3 的 readBody(=>readRawBody) 会 assertMethod 拒绝 GET（405），故读取 query 参数
  const query = getQuery<{ database?: string; table?: string; page?: string; pageSize?: string; where?: string }>(event)
  const { database, table, page, pageSize, where } = query
  if (!database || !table) throw createError({ statusCode: 400, statusMessage: '缺 database/table' })
  const safeDb = esc(database)
  const safeTable = esc(table)
  const limit = Math.min(Number(pageSize) || 50, 500)
  const offset = ((Number(page) || 1) - 1) * limit
  try {
    const { target } = await currentTarget()
    target.database = database
    const conn = await openMysql(target)
    try {
      let whereSql = ''
      const params: any[] = []
      if (where && typeof where === 'string' && where.trim()) {
        whereSql = ` WHERE ${where}`
      }
      const [rows] = await conn.query(`SELECT * FROM \`${safeTable}\`${whereSql} LIMIT ? OFFSET ?`, [limit, offset])
      const [[{ total }]] = (await conn.query(`SELECT COUNT(*) AS total FROM \`${safeTable}\`${whereSql}`, params)) as any
      return { rows, total }
    } finally {
      conn.end().catch(() => {})
    }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? 400, statusMessage: e?.message || String(e) })
  }
})