// 导出查询结果为 CSV（UTF-8 BOM，Excel 可直接打开）：
// 模式1 表格数据：?database=&table=&where=&connectionId= —— 导出当前表（含筛选）数据，上限 5 万行
// 模式2 SQL 控制台：?sql=<SELECT>&database=&connectionId= —— 导出控制台当前结果
// 导出为 GET 下载，由前端 fetch 为 blob 触发保存；值参数经反引号转义/参数绑定防注入。
export default defineEventHandler(async (event) => {
  const query = getQuery<{ sql?: string; database?: string; table?: string; where?: string; connectionId?: string }>(event)
  const { database, table, where, connectionId } = query
  const sqlMode = !!query.sql
  if (!sqlMode && (!database || !table)) throw createError({ statusCode: 400, statusMessage: '缺参数' })
  try {
    const { target } = connectionId ? await targetFor(connectionId) : await currentTarget()
    if (database) target.database = database
    const conn = await openMysql(target)
    try {
      let sql: string
      if (sqlMode) {
        sql = query.sql!
      } else {
        // 与 rows.get 相同的轻量护栏：剔除多语句分隔符与注释符
        const rawWhere = where && typeof where === 'string'
          ? where.replace(/;/g, ' ').replace(/--/g, ' ').replace(/#/g, ' ').trim() : ''
        sql = `SELECT * FROM \`${esc(table!)}\`${rawWhere ? ` WHERE ${rawWhere}` : ''} LIMIT 50000`
      }
      const [rows] = await conn.query(sql)
      const csv = toCsv(rows as any[])
      setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
      setResponseHeader(event, 'Content-Disposition', `attachment; filename="export_${Date.now()}.csv"`)
      return csv
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({
      statusCode: e?.statusCode ?? (e?.errno !== undefined ? 400 : 500),
      statusMessage: e?.sqlMessage || e?.message || String(e)
    })
  }
})

// 行数组转 CSV：含逗号/引号/换行的单元格加引号并转义内部引号；首行输出列名
function toCsv(rows: any[]): string {
  if (!rows.length) return '\uFEFF'
  const keys = Object.keys(rows[0])
  const cell = (v: any): string => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [keys.map(cell).join(',')]
  for (const r of rows) lines.push(keys.map(k => cell(r[k])).join(','))
  return '\uFEFF' + lines.join('\r\n')
}
