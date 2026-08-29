// 新增一行数据：接收 { database, table, row, connectionId? }，过滤值为空串的列后构造 INSERT（全空则触发默认值），
// 表名反引号转义、值参数绑定，用于数据网格的"新增行"。
export default defineEventHandler(async (event) => {
  const { database, table, row, connectionId } = await readBody(event)
  if (!database || !table || !row) throw createError({ statusCode: 400, statusMessage: '缺参数' })
  const safeTable = esc(table)
  try {
    const { target } = connectionId ? await targetFor(connectionId) : await currentTarget()
    target.database = database
    const conn = await openMysql(target)
    try {
      // 时间戳自动维护：created_at / updated_at 为空时自动填当前时间（表无默认值时也生效）
      const insertRow: Record<string, any> = { ...row }
      if ('created_at' in insertRow && !insertRow.created_at) insertRow.created_at = new Date()
      if ('updated_at' in insertRow && !insertRow.updated_at) insertRow.updated_at = new Date()
      // 过滤空字符串值，让自增主键/默认值列由数据库自行处理
      const keys = Object.keys(insertRow).filter(k => insertRow[k] !== '')
      if (keys.length === 0) {
        await conn.query(`INSERT INTO \`${safeTable}\` () VALUES ()`)
      } else {
        const placeholders = keys.map(() => '?').join(', ')
        const cols = keys.map(k => `\`${esc(k)}\``).join(', ')
        await conn.query(`INSERT INTO \`${safeTable}\` (${cols}) VALUES (${placeholders})`, keys.map(k => insertRow[k]))
      }
      return { ok: true }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? 400, statusMessage: e?.message || String(e) })
  }
})