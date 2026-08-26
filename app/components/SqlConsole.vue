<script setup lang="ts">
const api = useApi()
const sql = ref('')
const results = ref<any[]>([])
const message = ref('')
const err = ref('')
const loading = ref(false)

async function run() {
  if (!sql.value.trim()) return
  loading.value = true
  err.value = ''
  message.value = ''
  try {
    const res = (await api.call('/api/query', { method: 'POST', body: { sql: sql.value } })) as any
    if (res.type === 'select') {
      results.value = res.rows
      message.value = `${res.rowCount} 行`
    } else {
      results.value = []
      message.value = `影响 ${res.affectedRows} 行` + (res.insertId ? `, insertId=${res.insertId}` : '')
    }
    sql.value = ''
  } catch (e: any) {
    err.value = e?.data?.statusMessage || e?.message || String(e)
    results.value = []
    message.value = ''
  } finally {
    loading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    run()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
    <div class="flex justify-between items-center">
      <h3 class="font-semibold text-slate-700">SQL 控制台</h3>
      <span class="text-xs text-slate-400">Ctrl+Enter 执行</span>
    </div>
    <textarea
      v-model="sql"
      rows="6"
      placeholder="SELECT * FROM your_table LIMIT 100;"
      class="w-full border border-slate-300 rounded-lg p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y"
    ></textarea>
    <div class="flex gap-2 items-center">
      <UiButton variant="primary" :disabled="loading" @click="run">{{ loading ? '执行中…' : '执行' }}</UiButton>
      <span v-if="message" class="text-sm text-slate-500">{{ message }}</span>
    </div>
    <p v-if="err" class="text-sm text-red-600 whitespace-pre-wrap break-all">{{ err }}</p>
    <div v-if="results.length" class="overflow-x-auto max-h-[60vh] overflow-y-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0">
          <tr class="bg-slate-50 text-slate-600">
            <th v-for="c in Object.keys(results[0])" :key="c" class="text-left px-3 py-2 font-medium border-b border-slate-200 whitespace-nowrap">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in results" :key="i" class="border-b border-slate-100 hover:bg-slate-50">
            <td v-for="c in Object.keys(results[0])" :key="c" class="px-3 py-2 whitespace-nowrap">{{ r[c] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>