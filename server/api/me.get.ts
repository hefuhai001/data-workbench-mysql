export default defineEventHandler(() => {
  const row = sqlite.prepare('SELECT id FROM app_master WHERE id = 1').get()
  return { unlocked: session.unlocked, initialized: !!row }
})