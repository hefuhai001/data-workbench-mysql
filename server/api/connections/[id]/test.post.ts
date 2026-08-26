import { assertUnlocked } from '../../../utils/session'
import { decryptSecret } from '../../../utils/crypto'
import { sqlite } from '../../../utils/db'
import { testConnection } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const key = assertUnlocked()
  const id = getRouterParam(event, 'id')
  const row = sqlite.prepare('SELECT * FROM connections WHERE id = ?').get(id) as { id: string; host: string; port: number; user: string; defaultDatabase: string | null; ciphertext: string; iv: string } | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: '连接不存在' })
  const password = decryptSecret({ ciphertext: row.ciphertext, iv: row.iv }, key)
  return await testConnection({ host: row.host, port: row.port, user: row.user, password, database: row.defaultDatabase || undefined })
})