<script setup lang="ts">
const props = defineProps<{ database: string; table: string }>()
const api = useApi()
const rows = ref<any[]>([])
const cols = ref<string[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const where = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = (await api.call('/api/rows', {
      method: 'POST',
      body: { database: props.database, table: props.table, page: page.value, pageSize: pageSize.value, where: where.value }
    })) as any
    rows.value = res.rows
    total.value = res.total
    if (res.rows.length) cols.value = Object.keys(res.rows[0])
  } finally {
    loading.value = false
  }
}

function pageCount() { return Math.max(Math.ceil(total.value / pageSize.value), 1) }
function prev() { if (page.value > 1) { page.value--; load() } }
function next() { if (page.value < pageCount()) { page.value++; load() } }

onMounted(load)
watch(() => [props.database, props.table], load)
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="flex justify-between items-center px-3 py-2 border-b border-slate-200">
      <h3 class="font-semibold text-slate-700">数据 · {{ props.table }}</h3>
      <div class="text-xs text-slate-500">共 {{ total }} 行</div>
    </div>
    <div class="p-2">
      <input
        v-model="where"
        placeholder="WHERE 条件(可选材料，如 id > 100)"
        class="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        @keyup.enter="page = 1; load()"
      />
    </div>
    <div class="overflow-x-auto max-h-[60vh] overflow-y-auto">
      <p v-if="loading" class="p-4 text-sm text-slate-400">加载中…</p>
      <p v-else-if="!rows.length" class="p-4 text-sm text-slate-400">无数据。</p>
      <table v-else class="w-full text-sm">
        <thead class="sticky top-0">
          <tr class="bg-slate-50 text-slate-600">
            <th v-for="c in cols" :key="c" class="text-left px-3 py-2 font-medium whitespace-nowrap border-b border-slate-200">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" class="border-b border-slate-100 hover:bg-slate-50">
            <td v-for="c in cols" :key="c" class="px-3 py-2 text-slate-700 whitespace-nowrap">{{ r[c] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-between items-center px-3 py-2 border-t border-slate-200">
      <button :disabled="page <= 1" @click="prev" class="px-3 py-1 rounded border disabled:opacity-40 text-sm">上一页</button>
      <span class="text-sm text-slate-600">{{ page }} / {{ pageCount() }}</span>
      <button :disabled="page >= pageCount()" @click="next" class="px-3 py-1 rounded border disabled:opacity-40 text-sm">下一页</button>
    </div>
  </div>
</template>