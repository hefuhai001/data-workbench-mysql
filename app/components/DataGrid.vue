<script setup lang="ts">
const props = defineProps<{ database: string; table: string; connectionId?: string; title?: string }>()
const api = useApi()
const { downloading: exporting, download: exportRows } = useExport()

const rows = ref<any[]>([])
const cols = ref<string[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const where = ref('')
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const showStructure = ref(false)

// 表元数据：列定义 + 复合主键
const schema = ref<{ columns: any[]; primaryKey: string[] }>({ columns: [], primaryKey: [] })
const hasPk = computed(() => schema.value.primaryKey.length > 0)

// 行编辑/新增弹窗
const showAdd = ref(false)
const showEdit = ref(false)
const editingIndex = ref(-1)
const form = ref<Record<string, string>>({})
const formError = ref('')

// 新增表单仅对非自增列生成输入（自增主键/默认值列交由数据库处理）
const addColumns = computed(() => schema.value.columns.filter(c => (c.extra || '').toLowerCase() !== 'auto_increment'))

// 构建提交行：日期时间列统一规范化为 MySQL 可接受格式，避免 "2026-...T...Z" 报错
function buildRow(cols: any[]): Record<string, string> {
  const row: Record<string, string> = {}
  for (const c of cols) {
    const v = form.value[c.columnName]
    row[c.columnName] = v === undefined ? '' : (isDateTimeType(c.dataType) ? normalizeDateTime(v) : v)
  }
  return row
}

function buildQuery() {
  const p = new URLSearchParams({
    database: props.database,
    table: props.table,
    page: String(page.value),
    pageSize: String(pageSize.value)
  })
  if (props.connectionId) p.set('connectionId', props.connectionId)
  if (where.value.trim()) p.set('where', where.value)
  return p.toString()
}

async function loadSchema() {
  try {
    const q = new URLSearchParams({ database: props.database, table: props.table })
    if (props.connectionId) q.set('connectionId', props.connectionId)
    const res = (await api.call(`/api/table-schema?${q.toString()}`)) as any
    schema.value = { columns: res.columns || [], primaryKey: res.primaryKey || [] }
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || String(e)
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = (await api.call(`/api/rows?${buildQuery()}`)) as any
    rows.value = res.rows
    total.value = res.total
    if (res.rows.length) cols.value = Object.keys(res.rows[0])
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function pageCount() { return Math.max(Math.ceil(total.value / pageSize.value), 1) }
function prev() { if (page.value > 1) { page.value--; load() } }
function next() { if (page.value < pageCount()) { page.value++; load() } }

function refresh() { loadSchema(); load() }

// 导出当前表（含筛选条件）为 CSV
function doExport() {
  exportRows({
    database: props.database,
    table: props.table,
    where: where.value.trim() || undefined,
    connectionId: props.connectionId
  })
}

// ---- 新增 ----
function openAdd() {
  formError.value = ''
  const f: Record<string, string> = {}
  for (const c of addColumns.value) f[c.columnName] = ''
  form.value = f
  showAdd.value = true
}

async function confirmAdd() {
  saving.value = true
  formError.value = ''
  try {
    await api.call('/api/rows', { method: 'POST', body: { database: props.database, table: props.table, row: form.value, connectionId: props.connectionId } })
    showAdd.value = false
    page.value = 1
    await load()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || e?.message || String(e)
  } finally {
    saving.value = false
  }
}

// ---- 编辑 ----
function openEdit(r: any, i: number) {
  formError.value = ''
  const f: Record<string, string> = {}
  for (const c of schema.value.columns) f[c.columnName] = String(r[c.columnName] ?? '')
  form.value = f
  editingIndex.value = i
  showEdit.value = true
}

async function confirmEdit() {
  saving.value = true
  formError.value = ''
  try {
    const r = rows.value[editingIndex.value]
    const idCols = schema.value.primaryKey
    const idVals = idCols.map(pk => r[pk])
    await api.call('/api/rows', { method: 'PUT', body: { database: props.database, table: props.table, row: buildRow(schema.value.columns), idCols, idVals, connectionId: props.connectionId } })
    showEdit.value = false
    await load()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || e?.message || String(e)
  } finally {
    saving.value = false
  }
}

// ---- 删除 ----
async function removeRow(r: any) {
  if (!hasPk.value) return
  if (!confirm('确认删除该行？')) return
  const idCols = schema.value.primaryKey
  const idVals = idCols.map(pk => r[pk])
  try {
    await api.call('/api/rows', { method: 'DELETE', body: { database: props.database, table: props.table, idCols, idVals, connectionId: props.connectionId } })
    await load()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || String(e)
  }
}

onMounted(refresh)
watch(() => [props.database, props.table, props.connectionId], refresh)
</script>

<template>
  <div class="ios-card">
    <!-- 标题栏 -->
    <div class="flex justify-between items-center px-4 h-12 border-b border-ios-sep">
      <h3 class="text-[15px] font-semibold text-ios-label truncate">{{ title || '数据' }}</h3>
      <div class="flex items-center gap-2.5 shrink-0">
        <span class="text-xs text-ios-secondary whitespace-nowrap">共 {{ total }} 行</span>
        <UiButton
          variant="soft"
          size="sm"
          @click="showStructure = true"
        >结构</UiButton>
        <UiButton
          variant="soft"
          size="sm"
          :disabled="exporting || !rows.length"
          @click="doExport"
        >{{ exporting ? '导出中…' : '导出' }}</UiButton>
        <UiButton
          v-if="hasPk"
          variant="primary"
          size="sm"
          @click="openAdd"
        >＋ 新增行</UiButton>
      </div>
    </div>

    <p v-if="error" class="px-4 py-2.5 text-[13px] text-ios-red bg-red-50 border-b border-red-100">{{ error }}</p>

    <!-- 筛选输入 -->
    <div class="px-4 py-3">
      <input
        v-model="where"
        placeholder="WHERE 条件（如 id > 100），回车查询"
        class="ios-input text-sm"
        @keyup.enter="page = 1; load()"
      />
    </div>
    <div class="px-4 pb-1 text-xs text-ios-tertiary">
      <template v-if="!hasPk">该表无主键，仅支持只读与新增。</template>
      <template v-else>主键：{{ schema.primaryKey.join(', ') }} · 支持新增/编辑/删除</template>
    </div>

    <!-- 表格 -->
    <div class="overflow-x-auto max-h-[58vh] overflow-y-auto">
      <p v-if="loading" class="p-6 text-sm text-ios-tertiary text-center">加载中…</p>
      <p v-else-if="!rows.length" class="p-6 text-sm text-ios-tertiary text-center">无数据。</p>
      <table v-else class="w-full text-[13px] border-collapse">
        <thead class="sticky top-0 z-10">
          <tr class="bg-ios-fill/90 backdrop-blur-sm text-left">
            <th class="px-3 py-2 font-semibold text-ios-tertiary text-xs uppercase tracking-wider whitespace-nowrap">操作</th>
            <th v-for="c in cols" :key="c" class="px-3 py-2 font-semibold text-ios-tertiary text-xs uppercase tracking-wider whitespace-nowrap">{{ c }}</th>
          </tr>
        </thead>
        <tbody class="bg-ios-card">
          <tr v-for="(r, i) in rows" :key="i" class="odd:bg-white even:bg-[#f9f9fb] hover:bg-blue-50/40 transition-colors">
            <td class="px-3 py-2 whitespace-nowrap">
              <template v-if="hasPk">
                <button class="text-ios-blue font-medium hover:underline mr-3" @click="openEdit(r, i)">编辑</button>
                <button class="text-ios-red font-medium hover:underline" @click="removeRow(r)">删除</button>
              </template>
              <span v-else class="text-ios-quaternary">—</span>
            </td>
            <td v-for="c in cols" :key="c" class="px-3 py-2 text-ios-label whitespace-nowrap align-top">{{ r[c] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="flex justify-between items-center px-4 h-12 border-t border-ios-sep">
      <UiButton variant="soft" size="sm" :disabled="page <= 1" @click="prev">上一页</UiButton>
      <span class="text-[13px] text-ios-secondary">{{ page }} / {{ pageCount() }}</span>
      <UiButton variant="soft" size="sm" :disabled="page >= pageCount()" @click="next">下一页</UiButton>
    </div>
  </div>

  <TableStructure
    v-if="showStructure"
    :database="database"
    :table="table"
    :connection-id="connectionId"
    @close="showStructure = false"
  />

  <UiModal v-if="showAdd" title="新增行" @close="showAdd = false">
    <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <FieldInput
        v-for="c in addColumns"
        :key="c.columnName"
        :column="c"
        :hint="c.isNullable === 'NO' ? '必填' : ''"
        v-model="form[c.columnName]"
      />
    </div>
    <p v-if="formError" class="mt-2 text-sm text-ios-red">{{ formError }}</p>
    <div class="flex justify-end gap-2 mt-4">
      <UiButton @click="showAdd = false">取消</UiButton>
      <UiButton variant="primary" :disabled="saving" @click="confirmAdd">{{ saving ? '保存中…' : '保存' }}</UiButton>
    </div>
  </UiModal>

  <UiModal v-if="showEdit" title="编辑行" @close="showEdit = false">
    <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <FieldInput
        v-for="c in schema.columns"
        :key="c.columnName"
        :column="c"
        :hint="hasPk && schema.primaryKey.includes(c.columnName) ? '主键' : (c.isNullable === 'NO' ? '必填' : '')"
        v-model="form[c.columnName]"
      />
    </div>
    <p v-if="formError" class="mt-2 text-sm text-ios-red">{{ formError }}</p>
    <div class="flex justify-end gap-2 mt-4">
      <UiButton @click="showEdit = false">取消</UiButton>
      <UiButton variant="primary" :disabled="saving" @click="confirmEdit">{{ saving ? '保存中…' : '保存' }}</UiButton>
    </div>
  </UiModal>
</template>