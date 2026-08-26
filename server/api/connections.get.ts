// 查询连接列表：只返回非敏感列（不包含密码密文/IV），按更新时间倒序，供前端连接面板展示。
export default defineEventHandler(() => {
  assertUnlocked()
  const rows = sqlite.prepare('SELECT id, name, host, port, user, defaultDatabase, updatedAt FROM connections ORDER BY updatedAt DESC').all()
  return rows
})