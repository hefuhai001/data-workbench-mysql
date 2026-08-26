import { currentTarget } from '../utils/connect'
import { openMysql } from '../utils/mysql'
import { esc } from '../utils/escape'

export default defineEventHandler(async (event) => {
  // GET 请求下 h3 的 readBody(=>readRawBody) 会 assertMethod 拒绝 GET（405），故读取 query 参数
  const query = getQuery<{ database?: string; table?: string; page?: string; pageSize?: string; where?: string }>(event)
  const { database, table, page, pageSize, where } = query
  if (!database || !table) throw createError({ statusCode: 400, statusMessage: '缺 database/table' })
  const safeTable = esc(table)
  const limit = Math.min(Number(pageSize) || 50, 500)
  const offset = ((Number(page) || 1) - 1) * limit
  try {
    const { target } = await currentTarget()
    target.database = database
    const conn = await openMysql(target)
    try {
      // 轻量护栏：剔除多语句分隔符与注释符，避免 where 夹带注入/多条语句
      const rawWhere = where && typeof where === 'string'
        ? where.replace(/;/g, ' ').replace(/--/g, ' ').replace(/#/g, ' ').trim()
        : ''
      const whereSql = rawWhere ? ` WHERE ${rawWhere}` : ''

      const [rows] = await conn.query(`SELECT * FROM \`${safeTable}\`${whereSql} LIMIT ? OFFSET ?`, [limit, offset])

      // COUNT 使用截断到 LIMIT/ORDER BY 之前的精简 where，避免与排序/分页冲突
      let countWhere = ''
      const content = rawWhere
      if (content) {
        const lw = content.toLowerCase()
        const limitIdx = lw.search(/\blimit\b/)
        const orderIdx = lw.search(/\border\s+by\b/)
        const cutoff = Math.min(limitIdx === -1 ? Infinity : limitIdx, orderIdx === -1 ? Infinity : orderIdx)
        const trimmed = (cutoff === Infinity ? content : content.slice(0, cutoff)).trim()
        if (trimmed) countWhere = ` WHERE ${trimmed}`
      }
      const [[{ total }]] = (await conn.query(`SELECT COUNT(*) AS total FROM \`${safeTable}\`${countWhere}`)) as any
      return { rows, total }
    } finally {
      conn.end().catch(() => {})
    }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? 400, statusMessage: e?.message || String(e) })
  }
})