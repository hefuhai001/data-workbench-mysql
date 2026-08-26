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
const error = ref('')
const saving = ref(false)

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

function buildQuery() {
  const p = new URLSearchParams({
    database: props.database,
    table: props.table,
    page: String(page.value),
    pageSize: String(pageSize.value)
  })
  if (where.value.trim()) p.set('where', where.value)
  return p.toString()
}

async function loadSchema() {
  try {
    const res = (await api.call(`/api/table-schema?database=${encodeURIComponent(props.database)}&table=${encodeURIComponent(props.table)}`)) as any
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
    await api.call('/api/rows', { method: 'POST', body: { database: props.database, table: props.table, row: form.value } })
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
    await api.call('/api/rows', { method: 'PUT', body: { database: props.database, table: props.table, row: form.value, idCols, idVals } })
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
    await api.call('/api/rows', { method: 'DELETE', body: { database: props.database, table: props.table, idCols, idVals } })
    await load()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || String(e)
  }
}

onMounted(refresh)
watch(() => [props.database, props.table], refresh)
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="flex justify-between items-center px-3 py-2 border-b border-slate-200">
      <h3 class="font-semibold text-slate-700">数据 · {{ table }}</h3>
      <div class="flex items-center gap-3 text-xs text-slate-500">
        <span>共 {{ total }} 行</span>
        <button
          v-if="hasPk"
          class="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          @click="openAdd"
        >新增行</button>
      </div>
    </div>
    <p v-if="error" class="px-3 py-2 text-sm text-red-600 bg-red-50 border-b border-red-200">{{ error }}</p>
    <div class="p-2">
      <input
        v-model="where"
        placeholder="WHERE 条件(可选材料，如 id > 100)，回车查询"
        class="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        @keyup.enter="page = 1; load()"
      />
    </div>
    <div class="text-xs px-3 pb-1 text-slate-400">
      <template v-if="!hasPk">该表无主键，仅支持只读与新增。</template>
      <template v-else>主键：{{ schema.primaryKey.join(', ') }}；支持新增/编辑/删除。</template>
    </div>
    <div class="overflow-x-auto max-h-[60vh] overflow-y-auto">
      <p v-if="loading" class="p-4 text-sm text-slate-400">加载中…</p>
      <p v-else-if="!rows.length" class="p-4 text-sm text-slate-400">无数据。</p>
      <table v-else class="w-full text-sm">
        <thead class="sticky top-0">
          <tr class="bg-slate-50 text-slate-600">
            <th class="px-3 py-2 font-medium border-b border-slate-200">操作</th>
            <th v-for="c in cols" :key="c" class="text-left px-3 py-2 font-medium whitespace-nowrap border-b border-slate-200">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" class="border-b border-slate-100 hover:bg-slate-50">
            <td class="px-3 py-2 whitespace-nowrap">
              <template v-if="hasPk">
                <button class="text-blue-600 hover:underline mr-2" @click="openEdit(r, i)">编辑</button>
                <button class="text-red-600 hover:underline" @click="removeRow(r)">删除</button>
              </template>
              <span v-else class="text-slate-300">—</span>
            </td>
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

  <UiModal v-if="showAdd" title="新增行" @close="showAdd = false">
    <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <UiInput
        v-for="c in addColumns"
        :key="c.columnName"
        :label="`${c.columnName} (${c.dataType}${c.isNullable === 'NO' ? ' *' : ''})`"
        v-model="form[c.columnName]"
      />
    </div>
    <p v-if="formError" class="mt-2 text-sm text-red-600">{{ formError }}</p>
    <div class="flex justify-end gap-2 mt-4">
      <UiButton @click="showAdd = false">取消</UiButton>
      <UiButton variant="primary" :disabled="saving" @click="confirmAdd">{{ saving ? '保存中…' : '保存' }}</UiButton>
    </div>
  </UiModal>

  <UiModal v-if="showEdit" title="编辑行" @close="showEdit = false">
    <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <UiInput
        v-for="c in schema.columns"
        :key="c.columnName"
        :label="`${c.columnName} (${c.dataType}${hasPk && schema.primaryKey.includes(c.columnName) ? ' · 主键' : ''})`"
        v-model="form[c.columnName]"
      />
    </div>
    <p v-if="formError" class="mt-2 text-sm text-red-600">{{ formError }}</p>
    <div class="flex justify-end gap-2 mt-4">
      <UiButton @click="showEdit = false">取消</UiButton>
      <UiButton variant="primary" :disabled="saving" @click="confirmEdit">{{ saving ? '保存中…' : '保存' }}</UiButton>
    </div>
  </UiModal>
</template>