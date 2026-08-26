import { assertUnlocked } from '../utils/session'
import { encryptSecret, randomHex } from '../utils/crypto'
import { sqlite } from '../utils/db'

export default defineEventHandler(async (event) => {
  const key = assertUnlocked()
  const body = await readBody(event)
  const { name, host, port, user, password, defaultDatabase } = body
  if (!name || !host || !port || !user) {
    throw createError({ statusCode: 400, statusMessage: '缺少必填字段' })
  }
  const id = randomHex(16)
  const enc = encryptSecret(password || '', key)
  sqlite.prepare(
    `INSERT INTO connections (id, name, host, port, user, defaultDatabase, ciphertext, iv)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, host, Number(port), user, defaultDatabase || null, enc.ciphertext, enc.iv)
  return { id }
})