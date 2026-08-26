export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  if (!password || typeof password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: '缺少密码' })
  }
  const row = sqlite.prepare('SELECT masterPasswordHash, masterSalt FROM app_master WHERE id = 1').get() as { masterPasswordHash: string; masterSalt: string } | undefined
  if (!row || !verifyPassword(password, row.masterPasswordHash, row.masterSalt)) {
    throw createError({ statusCode: 401, statusMessage: '主密码错误' })
  }
  session.masterKey = createKey(password, row.masterSalt)
  session.unlocked = true
  return { ok: true }
})