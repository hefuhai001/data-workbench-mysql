export default defineEventHandler(async (event) => {
  const oldKey = assertUnlocked()
  const { oldPassword, newPassword } = await readBody(event)
  const row = sqlite.prepare('SELECT masterPasswordHash, masterSalt FROM app_master WHERE id = 1').get() as { masterPasswordHash: string; masterSalt: string }
  if (!row || !verifyPassword(oldPassword, row.masterPasswordHash, row.masterSalt)) {
    throw createError({ statusCode: 401, statusMessage: '原密码错误' })
  }
  if (!newPassword || newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: '新密码至少 6 位' })
  }
  const { hash, salt } = hashPassword(newPassword)
  const newKey = createKey(newPassword, salt)

  // 用旧密钥解密全部连接、用新密钥重加密
  const connRows = sqlite.prepare('SELECT id, ciphertext, iv FROM connections').all() as { id: string; ciphertext: string; iv: string }[]
  const update = sqlite.prepare('UPDATE connections SET ciphertext = ?, iv = ? WHERE id = ?')
  const reencryptAll = sqlite.transaction((rows: { id: string; ciphertext: string; iv: string }[]) => {
    for (const c of rows) {
      const plain = decryptSecret({ ciphertext: c.ciphertext, iv: c.iv }, oldKey)
      const enc = encryptSecret(plain, newKey)
      update.run(enc.ciphertext, enc.iv, c.id)
    }
  })
  reencryptAll(connRows)

  sqlite.prepare('UPDATE app_master SET masterPasswordHash = ?, masterSalt = ? WHERE id = 1').run(hash, salt)
  session.masterKey = newKey
  return { ok: true }
})