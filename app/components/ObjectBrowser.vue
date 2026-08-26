<script setup lang="ts">
const api = useApi()
const loading = ref(false)
const dbs = ref<any[]>([])
const expanded = ref<Record<string, boolean>>({})
const tables = ref<Record<string, any[]>>({})
const emit = defineEmits<{ selectTable: [any] }>()

async function load() {
  loading.value = true
  try { dbs.value = (await api.call('/api/databases')) as any[] }
  finally { loading.value = false }
}

async function toggle(db: any) {
  expanded.value[db.name] = !expanded.value[db.name]
  if (expanded.value[db.name] && !tables.value[db.name]) {
    tables.value[db.name] = (await api.call(`/api/databases/${encodeURIComponent(db.name)}/tables`)) as any[]
  }
}

onMounted(load)
defineExpose({ load })
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-3">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-semibold text-slate-700">对象</h3>
      <button class="text-xs text-slate-400 hover:text-blue-600" @click="load">刷新</button>
    </div>
    <p v-if="loading" class="text-sm text-slate-400">加载中…</p>
    <div v-else-if="!dbs.length" class="text-sm text-slate-400">未选择连接或无可浏览数据库。</div>
    <div v-else class="space-y-0.5">
      <div v-for="db in dbs" :key="db.name">
        <button class="flex items-center gap-1 w-full text-left py-1 px-2 rounded hover:bg-slate-100 text-slate-700 text-sm" @click="toggle(db)">
          <span>{{ expanded[db.name] ? '▾' : '▸' }}</span>
          <span>🗄 {{ db.name }}</span>
        </button>
        <div v-if="expanded[db.name]" class="ml-5 space-y-0.5">
          <button
            v-for="t in (tables[db.name] || []).filter((x: any) => x.type === 'BASE TABLE')"
            :key="'t' + t.name"
            class="block w-full text-left text-sm text-slate-600 py-1 px-2 rounded hover:bg-blue-50"
            @click="emit('selectTable', { database: db.name, name: t.name })"
          >
            表 {{ t.name }}
          </button>
          <button
            v-for="v in (tables[db.name] || []).filter((x: any) => x.type !== 'BASE TABLE')"
            :key="'v' + v.name"
            class="block w-full text-left text-sm text-slate-400 py-1 px-2"
            @click="emit('selectTable', { database: db.name, name: v.name })"
          >
            视图 {{ v.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>