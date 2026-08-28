// 保存/更新一条侧边栏备注：{ key, note }。note 非空则 upsert，为空则视为删除。
export default defineEventHandler(async (event) => {
  assertUnlocked()
  const { key, note } = await readBody(event)
  if (!key || typeof key !== 'string' || key.length > 500) {
    throw createError({ statusCode: 400, statusMessage: '缺 key 或 key 过长' })
  }
  const text = typeof note === 'string' ? note.trim() : ''
  if (!text) {
    sqlite.prepare('DELETE FROM notes WHERE key = ?').run(key)
    return { ok: true, deleted: true }
  }
  sqlite.prepare(
    `INSERT INTO notes (key, note, updatedAt) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET note = excluded.note, updatedAt = datetime('now')`
  ).run(key, text)
  return { ok: true }
})
