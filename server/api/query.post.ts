// SQL 控制台执行：对当前连接执行任意 SQL，返回全部结果集数组 results，
// 每个元素为 {type:'select',rows,rowCount} 或 {type:'affect',affectedRows,insertId}，支持多语句。
export default defineEventHandler(async (event) => {
  const { sql, database } = await readBody(event)
  if (!sql || typeof sql !== 'string') throw createError({ statusCode: 400, statusMessage: '缺 SQL' })
  try {
    const { target } = await currentTarget()
    if (database) target.database = database
    const conn = await openMysql(target)
    try {
      // 多语句执行：conn.query 返回 [ [语句1结果, 语句2结果, ...], [fields...] ]；
      // 单语句时 raw[0] 直接是结果（行数组或 ResultSetHeader），统一归一为数组逐条输出
      const raw = (await conn.query(sql)) as unknown[]
      const first = raw[0] as any
      const isMulti = Array.isArray(first) && first.length > 0 && Array.isArray(first[0])
      const list: any[] = isMulti ? first : [first]
      const results = list.map((rs: any) => {
        if (Array.isArray(rs)) {
          return { type: 'select', rows: rs, rowCount: rs.length }
        }
        return { type: 'affect', affectedRows: rs?.affectedRows ?? 0, insertId: rs?.insertId }
      })
      return { results }
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