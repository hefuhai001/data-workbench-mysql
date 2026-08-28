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
  <div class="ios-card">
    <div class="flex justify-between items-center px-4 h-12 border-b border-ios-sep">
      <h3 class="text-[15px] font-semibold text-ios-label">SQL 控制台</h3>
      <span class="text-xs text-ios-tertiary">Ctrl/⌘ + Enter 执行</span>
    </div>

    <div class="p-4 space-y-3">
      <textarea
        v-model="sql"
        rows="6"
        placeholder="SELECT * FROM your_table LIMIT 100;"
        class="w-full border border-ios-sep rounded-xl p-3.5 font-mono text-[13px] text-ios-label bg-ios-fill/60 outline-none focus:border-ios-blue focus:bg-white resize-y transition placeholder:text-ios-quaternary"
      ></textarea>
      <div class="flex gap-2 items-center">
        <UiButton variant="primary" :disabled="loading" @click="run">{{ loading ? '执行中…' : '执行' }}</UiButton>
        <span v-if="message" class="text-[13px] text-ios-secondary">{{ message }}</span>
      </div>
      <p v-if="err" class="text-[13px] text-ios-red whitespace-pre-wrap break-all">{{ err }}</p>
    </div>

    <!-- 结果表格 -->
    <div v-if="results.length" class="overflow-x-auto max-h-[58vh] overflow-y-auto border-t border-ios-sep">
      <table class="w-full text-[13px] border-collapse">
        <thead class="sticky top-0 z-10">
          <tr class="bg-ios-fill/90 backdrop-blur-sm text-left">
            <th v-for="c in Object.keys(results[0])" :key="c" class="px-3 py-2 font-semibold text-ios-tertiary text-xs uppercase tracking-wider whitespace-nowrap">{{ c }}</th>
          </tr>
        </thead>
        <tbody class="bg-ios-card">
          <tr v-for="(r, i) in results" :key="i" class="odd:bg-white even:bg-[#f9f9fb] hover:bg-blue-50/40 transition-colors">
            <td v-for="c in Object.keys(results[0])" :key="c" class="px-3 py-2 text-ios-label whitespace-nowrap align-top">{{ r[c] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>