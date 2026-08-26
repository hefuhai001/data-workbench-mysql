// 删除指定连接配置，从 connections 表移除对应记录。
export default defineEventHandler(async (event) => {
  assertUnlocked()
  const id = getRouterParam(event, 'id')
  sqlite.prepare('DELETE FROM connections WHERE id = ?').run(id)
  return { ok: true }
})