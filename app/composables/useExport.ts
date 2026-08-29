// 导出工具：请求 /api/export 获取 CSV 文本，构造 Blob 触发浏览器下载
export function useExport() {
  const downloading = ref(false)
  const error = ref('')

  const download = async (query: Record<string, string | undefined>) => {
    downloading.value = true
    error.value = ''
    try {
      const p = new URLSearchParams()
      for (const [k, v] of Object.entries(query)) if (v) p.set(k, v)
      const csv = (await $fetch(`/api/export?${p.toString()}`)) as string
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch (e: any) {
      error.value = e?.data?.statusMessage || e?.message || String(e)
    } finally {
      downloading.value = false
    }
  }

  return { downloading, error, download }
}
