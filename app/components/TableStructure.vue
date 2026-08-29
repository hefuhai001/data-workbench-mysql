<script setup lang="ts">
// 表结构查看弹窗：展示列定义、索引、外键与 CREATE TABLE DDL，数据来自 /api/table-schema
const props = defineProps<{ database: string; table: string; connectionId?: string }>()
const emit = defineEmits<{ close: [] }>()
const api = useApi()

const data = ref<{ columns: any[]; indexes: any[]; foreignKeys: any[]; ddl: string } | null>(null)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const q = new URLSearchParams({ database: props.database, table: props.table })
    if (props.connectionId) q.set('connectionId', props.connectionId)
    data.value = (await api.call(`/api/table-schema?${q.toString()}`)) as any
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || String(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <UiModal :title="`${database}.${table} · 表结构`" max-w="max-w-2xl" @close="emit('close')">
    <p v-if="loading" class="text-sm text-ios-tertiary text-center py-8">加载中…</p>
    <p v-else-if="error" class="text-sm text-ios-red py-4">{{ error }}</p>
    <template v-else-if="data">
      <div class="max-h-[62vh] overflow-y-auto space-y-5 pr-1">
        <!-- 列 -->
        <section>
          <h4 class="text-[13px] font-semibold text-ios-secondary mb-2">列</h4>
          <div class="overflow-x-auto border border-ios-sep rounded-xl">
            <table class="w-full text-[12.5px] border-collapse">
              <thead><tr class="bg-ios-fill/80 text-left text-ios-tertiary">
                <th class="px-3 py-2 font-semibold whitespace-nowrap">列名</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">类型</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">可空</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">默认值</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">键</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">额外</th>
              </tr></thead>
              <tbody class="bg-ios-card">
                <tr v-for="c in data.columns" :key="c.columnName" class="odd:bg-white even:bg-[#f9f9fb] align-top">
                  <td class="px-3 py-1.5 font-medium text-ios-label whitespace-nowrap">{{ c.columnName }}</td>
                  <td class="px-3 py-1.5 font-mono text-[12px] text-ios-blue whitespace-nowrap">{{ c.columnType }}</td>
                  <td class="px-3 py-1.5 text-ios-secondary whitespace-nowrap">{{ c.isNullable }}</td>
                  <td class="px-3 py-1.5 font-mono text-[12px] text-ios-secondary whitespace-nowrap">{{ c.columnDefault ?? '—' }}</td>
                  <td class="px-3 py-1.5 whitespace-nowrap">
                    <span v-if="c.columnKey" class="px-1.5 py-0.5 rounded bg-blue-50 text-ios-blue text-[11px] font-medium">{{ c.columnKey }}</span>
                    <span v-else class="text-ios-quaternary">—</span>
                  </td>
                  <td class="px-3 py-1.5 text-ios-secondary whitespace-nowrap">{{ c.extra || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 索引 -->
        <section v-if="data.indexes.length">
          <h4 class="text-[13px] font-semibold text-ios-secondary mb-2">索引</h4>
          <div class="overflow-x-auto border border-ios-sep rounded-xl">
            <table class="w-full text-[12.5px] border-collapse">
              <thead><tr class="bg-ios-fill/80 text-left text-ios-tertiary">
                <th class="px-3 py-2 font-semibold whitespace-nowrap">索引名</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">唯一</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">列</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">类型</th>
              </tr></thead>
              <tbody class="bg-ios-card">
                <tr v-for="(ix, i) in data.indexes" :key="i" class="odd:bg-white even:bg-[#f9f9fb]">
                  <td class="px-3 py-1.5 font-medium text-ios-label whitespace-nowrap">{{ ix.Key_name }}</td>
                  <td class="px-3 py-1.5 text-ios-secondary whitespace-nowrap">{{ ix.Non_unique === 0 ? '是' : '否' }}</td>
                  <td class="px-3 py-1.5 font-mono text-[12px] text-ios-blue whitespace-nowrap">{{ ix.Column_name }}</td>
                  <td class="px-3 py-1.5 text-ios-secondary whitespace-nowrap">{{ ix.Index_type }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 外键 -->
        <section v-if="data.foreignKeys.length">
          <h4 class="text-[13px] font-semibold text-ios-secondary mb-2">外键</h4>
          <div class="overflow-x-auto border border-ios-sep rounded-xl">
            <table class="w-full text-[12.5px] border-collapse">
              <thead><tr class="bg-ios-fill/80 text-left text-ios-tertiary">
                <th class="px-3 py-2 font-semibold whitespace-nowrap">约束名</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">列</th>
                <th class="px-3 py-2 font-semibold whitespace-nowrap">引用</th>
              </tr></thead>
              <tbody class="bg-ios-card">
                <tr v-for="(fk, i) in data.foreignKeys" :key="i" class="odd:bg-white even:bg-[#f9f9fb]">
                  <td class="px-3 py-1.5 text-ios-label whitespace-nowrap">{{ fk.constraintName }}</td>
                  <td class="px-3 py-1.5 font-mono text-[12px] text-ios-blue whitespace-nowrap">{{ fk.columnName }}</td>
                  <td class="px-3 py-1.5 font-mono text-[12px] text-ios-secondary whitespace-nowrap">{{ fk.refTable }}.{{ fk.refColumn }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- DDL -->
        <section>
          <h4 class="text-[13px] font-semibold text-ios-secondary mb-2">DDL</h4>
          <pre class="max-h-56 overflow-auto bg-ios-fill/60 border border-ios-sep rounded-xl p-3 font-mono text-[12px] leading-relaxed text-ios-label whitespace-pre-wrap break-all">{{ data.ddl }}</pre>
        </section>
      </div>
    </template>
  </UiModal>
</template>
