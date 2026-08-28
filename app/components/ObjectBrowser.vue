<script setup lang="ts">
const api = useApi()
const loading = ref(false)
const dbs = ref<any[]>([])
const expanded = ref<Record<string, boolean>>({})
const tables = ref<Record<string, any[]>>({})
const selected = ref<{ database: string; name: string } | null>(null)
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

function select(db: string, t: any) {
  selected.value = { database: db, name: t.name }
  emit('selectTable', { database: db, name: t.name })
}

onMounted(load)
defineExpose({ load })
</script>

<template>
  <div class="ios-card">
    <div class="flex items-center justify-between px-4 h-11 border-b border-ios-sep">
      <h3 class="text-[15px] font-semibold text-ios-label">对象</h3>
      <button
        class="text-[13px] text-ios-blue active:opacity-60"
        @click="load"
      >刷新</button>
    </div>

    <p v-if="loading" class="px-4 py-6 text-sm text-ios-tertiary text-center">加载中…</p>
    <p v-else-if="!dbs.length" class="px-4 py-6 text-sm text-ios-tertiary text-center">未选择连接或无可浏览数据库。</p>
    <div v-else class="p-2 space-y-1 max-h-[68vh] overflow-y-auto">
      <div v-for="db in dbs" :key="db.name">
        <!-- 数据库行 -->
        <button
          class="ios-sidebar-row font-medium"
          @click="toggle(db)"
        >
          <svg class="size-3.5 mr-1.5 text-ios-tertiary shrink-0 transition-transform duration-150"
            :class="expanded[db.name] ? 'rotate-90' : ''"
            viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg class="size-4 mr-1.5 text-ios-orange shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L2 8l10 5 10-5-10-5zm10 10.5L12 20 2 13.5V11l10 5 10-5v2.5z"/>
          </svg>
          <span class="truncate">{{ db.name }}</span>
        </button>

        <!-- 表/视图列表 -->
        <div v-if="expanded[db.name]" class="ml-[14px] pl-[14px] space-y-0.5 border-l border-ios-sep">
          <button
            v-for="t in (tables[db.name] || []).filter((x: any) => x.type === 'BASE TABLE')"
            :key="'t' + t.name"
            class="ios-sidebar-row"
            :class="selected?.database === db.name && selected?.name === t.name && 'active'"
            @click="select(db.name, t)"
          >
            <svg class="size-3.5 mr-2 text-ios-blue shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
            </svg>
            <span class="truncate">{{ t.name }}</span>
          </button>
          <button
            v-for="v in (tables[db.name] || []).filter((x: any) => x.type !== 'BASE TABLE')"
            :key="'v' + v.name"
            class="ios-sidebar-row text-ios-secondary"
            :class="selected?.database === db.name && selected?.name === v.name && 'active'"
            @click="select(db.name, v)"
          >
            <svg class="size-3.5 mr-2 text-ios-tertiary shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4a8 8 0 110 16H7a1 1 0 01-1-1V9a5 5 0 010-10h6zm1 10V8h-2v6h2zm0 4h-2v2h2v-2z"/>
            </svg>
            <span class="truncate">{{ v.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>