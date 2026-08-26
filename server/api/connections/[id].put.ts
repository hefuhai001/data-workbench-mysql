import { assertUnlocked } from '../../utils/session'
import { encryptSecret } from '../../utils/crypto'
import { sqlite } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const key = assertUnlocked()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const row = sqlite.prepare('SELECT * FROM connections WHERE id = ?').get(id) as { id: string; name: string; host: string; port: number; user: string; defaultDatabase: string | null; ciphertext: string; iv: string } | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: '连接不存在' })
  const name = body.name ?? row.name
  const host = body.host ?? row.host
  const port = body.port ?? row.port
  const user = body.user ?? row.user
  const defaultDatabase = body.defaultDatabase ?? row.defaultDatabase
  let ciphertext = row.ciphertext
  let iv = row.iv
  if (body.password !== undefined && body.password !== '') {
    const enc = encryptSecret(body.password, key)
    ciphertext = enc.ciphertext; iv = enc.iv
  }
  sqlite.prepare(
    `UPDATE connections SET name=?, host=?, port=?, user=?, defaultDatabase=?, ciphertext=?, iv=?, updatedAt=datetime('now') WHERE id=?`
  ).run(name, host, Number(port), user, defaultDatabase, ciphertext, iv, id)
  return { ok: true }
})