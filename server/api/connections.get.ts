export default defineEventHandler(() => {
  assertUnlocked()
  const rows = sqlite.prepare('SELECT id, name, host, port, user, defaultDatabase, updatedAt FROM connections ORDER BY updatedAt DESC').all()
  return rows
})