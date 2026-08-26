// 返回应用初始化与解锁状态：是否存在主密码（initialized）以及当前内存会话是否已解锁，
// 供前端启动时决定展示"设置主密码"还是"解锁"页面。
export default defineEventHandler(() => {
  const row = sqlite.prepare('SELECT id FROM app_master WHERE id = 1').get()
  return { unlocked: session.unlocked, initialized: !!row }
})