// 首次初始化：设置主密码。校验长度后生成随机盐的 PBKDF2 哈希存入 app_master，
// 并用该密码派生 AES 密钥写入内存会话直接进入已解锁状态（仅首次可用）。
export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: '主密码至少 6 位' })
  }
  const existing = sqlite.prepare('SELECT id FROM app_master WHERE id = 1').get()
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: '已初始化' })
  }
  const { hash, salt } = hashPassword(password)
  sqlite.prepare('INSERT INTO app_master (id, masterPasswordHash, masterSalt) VALUES (1, ?, ?)').run(hash, salt)
  session.masterKey = createKey(password, salt)
  session.unlocked = true
  return { ok: true }
})