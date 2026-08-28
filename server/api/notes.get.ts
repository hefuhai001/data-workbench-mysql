// 返回全部侧边栏备注：key 形如 conn:<id> / db:<connId>:<db> / table:<connId>:<db>:<table>，
// 前端按 key 关联到树节点展示。仅解锁后可读。
export default defineEventHandler(() => {
  assertUnlocked()
  const rows = sqlite.prepare('SELECT key, note FROM notes').all() as { key: string; note: string }[]
  return rows
})
