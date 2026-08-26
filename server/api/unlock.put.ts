import { assertUnlocked } from '../utils/session'
import { verifyPassword, hashPassword, createKey } from '../utils/crypto'
import { sqlite } from '../utils/db'
import { session } from '../utils/session'

export default defineEventHandler(async (event) => {
  assertUnlocked()
  const { oldPassword, newPassword } = await readBody(event)
  const row = sqlite.prepare('SELECT masterPasswordHash, masterSalt FROM app_master WHERE id = 1').get() as { masterPasswordHash: string; masterSalt: string }
  if (!row || !verifyPassword(oldPassword, row.masterPasswordHash, row.masterSalt)) {
    throw createError({ statusCode: 401, statusMessage: '原密码错误' })
  }
  if (!newPassword || newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: '新密码至少 6 位' })
  }
  const { hash, salt } = hashPassword(newPassword)
  sqlite.prepare('UPDATE app_master SET masterPasswordHash = ?, masterSalt = ? WHERE id = 1').run(hash, salt)
  session.masterKey = createKey(newPassword, salt)
  return { ok: true }
})