// 新增一个 MySQL 连接配置：校验必填字段，用 session 中的 AES 密钥对密码加密，
// 存入 SQLite 的 connections 表，返回新连接的 id。密文（+认证标签）与 IV 分别存 ciphertext/iv。
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