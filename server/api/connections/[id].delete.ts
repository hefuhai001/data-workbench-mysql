export default defineEventHandler(async (event) => {
  assertUnlocked()
  const id = getRouterParam(event, 'id')
  sqlite.prepare('DELETE FROM connections WHERE id = ?').run(id)
  return { ok: true }
})