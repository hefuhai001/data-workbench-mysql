// 删除一条侧边栏备注：query 参数 key。
export default defineEventHandler(async (event) => {
  assertUnlocked()
  const { key } = getQuery<{ key?: string }>(event)
  if (!key) throw createError({ statusCode: 400, statusMessage: '缺 key' })
  sqlite.prepare('DELETE FROM notes WHERE key = ?').run(key)
  return { ok: true }
})
