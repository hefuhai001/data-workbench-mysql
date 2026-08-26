import { assertUnlocked, session } from '../../../utils/session'
import { sqlite } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  assertUnlocked()
  const id = getRouterParam(event, 'id')
  const row = sqlite.prepare('SELECT id FROM connections WHERE id = ?').get(id) as { id: string } | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: '连接不存在' })
  session.currentConnectionId = id ?? null
  return { ok: true }
})