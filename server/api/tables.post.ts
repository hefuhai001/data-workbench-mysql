// 危险的表级操作：按 action 执行 DROP TABLE 或 TRUNCATE TABLE，仅用于用户显式删除/清空表，
// 表名反引号转义，防止 SQL 注入破坏。
export default defineEventHandler(async (event) => {
  const { database, name, action } = await readBody(event)
  if (!database || !name) throw createError({ statusCode: 400, statusMessage: '缺参数' })
  try {
    const { target } = await currentTarget()
    target.database = database
    const conn = await openMysql(target)
    try {
      if (action === 'drop') {
        await conn.query(`DROP TABLE \`${esc(name)}\``)
      } else if (action === 'truncate') {
        await conn.query(`TRUNCATE TABLE \`${esc(name)}\``)
      } else {
        throw new Error('不支持的 action')
      }
      return { ok: true }
    } finally { conn.end().catch(() => {}) }
  } catch (e: any) {
    throw createError({ statusCode: e?.statusCode ?? 400, statusMessage: e?.message || String(e) })
  }
})