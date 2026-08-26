// 将指定连接设为"当前连接"：写入内存 session 的 currentConnectionId，
// 供后续数据库/表浏览、行操作、SQL 控制台默认使用该连接。
export default defineEventHandler(async (event) => {
  assertUnlocked()
  const id = getRouterParam(event, 'id')
  const row = sqlite.prepare('SELECT id FROM connections WHERE id = ?').get(id) as { id: string } | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: '连接不存在' })
  session.currentConnectionId = id ?? null
  return { ok: true }
})