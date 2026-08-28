// 侧边栏备注的共享状态与 API：notes 以 key -> note 形式存于 useState，
// key 与树节点 key 一致（conn:<id> / db:<connId>:<db> / table:<connId>:<db>:<table>）。
export function useNotes() {
  const notes = useState<Record<string, string>>('wb-notes', () => ({}))

  async function loadNotes() {
    const rows = (await useApi().call('/api/notes')) as { key: string; note: string }[]
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.note
    notes.value = map
  }

  // note 为空串则删除该备注
  async function saveNote(key: string, note: string) {
    if (note.trim()) {
      await useApi().call('/api/notes', { method: 'PUT', body: { key, note } })
      notes.value = { ...notes.value, [key]: note }
    } else {
      await useApi().call(`/api/notes?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      const next = { ...notes.value }
      delete next[key]
      notes.value = next
    }
  }

  return { notes, loadNotes, saveNote }
}
