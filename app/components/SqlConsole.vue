<script setup lang="ts">
// SQL 控制台：语法高亮编辑器 + 自动补全(Ctrl+Space/输入触发) + 历史记录(localStorage) +
// 多结果集标签页展示 + 当前结果导出 CSV
const api = useApi()

const sql = ref('')
const results = ref<Array<{ type: string; rows?: any[]; rowCount?: number; affectedRows?: number; insertId?: number }>>([])
const activeResult = ref(0)
const message = ref('')
const err = ref('')
const loading = ref(false)

// ---- 历史记录（localStorage 持久化，最多 50 条） ----
const HISTORY_KEY = 'wb-sql-history'
const history = ref<string[]>([])
const historyIndex = ref(-1)
const showHistory = ref(false)
function loadHistory() {
  try { history.value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { history.value = [] }
}
function saveHistory() { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value.slice(0, 50))) } catch { /* ignore */ } }
function pushHistory(s: string) {
  history.value = [s, ...history.value.filter(h => h !== s)].slice(0, 50)
  saveHistory()
}

// ---- 语法高亮（轻量 tokenizer，输出 HTML 片段） ----
const KEYWORDS = new Set(`
SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DATABASE INDEX VIEW ALTER DROP
TRUNCATE RENAME JOIN LEFT RIGHT INNER OUTER FULL CROSS ON USING GROUP BY ORDER HAVING LIMIT OFFSET
AS DISTINCT UNION ALL AND OR NOT NULL IS IN LIKE BETWEEN EXISTS CASE WHEN THEN ELSE END PRIMARY KEY
FOREIGN REFERENCES UNIQUE CONSTRAINT DEFAULT AUTO_INCREMENT COLLATE CHARACTER CHARSET ENGINE INT INTEGER
BIGINT SMALLINT TINYINT DECIMAL FLOAT DOUBLE CHAR VARCHAR TEXT DATE TIME DATETIME TIMESTAMP BLOB JSON
ENUM BOOLEAN IF ELSEIF WHILE LOOP BEGIN COMMIT ROLLBACK START TRANSACTION USE SHOW DESCRIBE EXPLAIN
GRANT REVOKE PROCEDURE FUNCTION TRIGGER DECLARE PREPARE EXECUTE DEALLOCATE WITH RECURSIVE RETURNS
COALESCE IFNULL COUNT SUM AVG MIN MAX NOW CURDATE CONCAT SUBSTRING REPLACE UPPER LOWER TRIM LENGTH
ABS ROUND FLOOR CEIL MOD POW CAST CONVERT DATE_FORMAT GROUP_CONCAT
`.trim().split(/\s+/))

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function highlight(text: string): string {
  const re = /('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`]|``)*`|--[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*)/g
  let html = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    html += escHtml(text.slice(last, m.index))
    const tok = m[0]
    const ch = tok[0]
    let style = ''
    if (ch === "'" || ch === '"') style = 'color:#059669'                       // 字符串
    else if (ch === '`') style = 'color:#7c3aed'                                 // 反引号标识符
    else if (ch === '-' || tok.startsWith('/*')) style = 'color:#9ca3af;font-style:italic' // 注释
    else if (/^\d/.test(tok)) style = 'color:#d97706'                            // 数字
    else if (KEYWORDS.has(tok.toUpperCase())) style = 'color:#2563eb;font-weight:600'     // 关键字
    else style = ''
    html += style ? `<span style="${style}">${escHtml(tok)}</span>` : escHtml(tok)
    last = m.index + tok.length
  }
  html += escHtml(text.slice(last))
  return html
}

// ---- 编辑器滚动同步（高亮层与输入层） ----
const preRef = ref<HTMLPreElement>()
const areaRef = ref<HTMLTextAreaElement>()
function syncScroll() {
  if (preRef.value && areaRef.value) {
    preRef.value.scrollTop = areaRef.value.scrollTop
    preRef.value.scrollLeft = areaRef.value.scrollLeft
  }
}

// ---- 自动补全 ----
interface SuggestItem { label: string; type: 'keyword' | 'table' | 'column' }
const suggestCache = ref<{ database: string; tables: { name: string; columns: string[] }[] } | null>(null)
const suggestLoading = ref(false)
const showSuggest = ref(false)
const suggestList = ref<SuggestItem[]>([])
const suggestIndex = ref(0)
let suggestStart = 0          // 单词起始位置
let suggestTable = ''         // 当前补全上下文（tab. 前缀）
let suggestTimer: ReturnType<typeof setTimeout> | null = null

async function ensureSuggest() {
  if (suggestCache.value) return
  suggestLoading.value = true
  try {
    suggestCache.value = (await api.call('/api/suggest')) as any
  } catch {
    suggestCache.value = { database: '', tables: [] }
  } finally {
    suggestLoading.value = false
  }
}

// 提取光标前的当前单词（支持 tab. 前缀）
function currentWordAt(pos: number): { start: number; word: string; table: string } {
  const text = sql.value.slice(0, pos)
  let i = text.length
  let word = ''
  while (i > 0 && /[A-Za-z0-9_$]/.test(text.charAt(i - 1))) { word = text.charAt(i - 1) + word; i-- }
  let table = ''
  if (word && i > 0 && text.charAt(i - 1) === '.') {
    let j = i - 1
    while (j > 0 && /[A-Za-z0-9_$]/.test(text.charAt(j - 1))) { table = text.charAt(j - 1) + table; j-- }
    return { start: j, word, table }
  }
  return { start: i, word, table }
}

function buildSuggestions(word: string, table: string): SuggestItem[] {
  const w = word.toLowerCase()
  const items: SuggestItem[] = []
  if (table) {
    const t = suggestCache.value?.tables.find(x => x.name === table)
    if (t) for (const c of t.columns) items.push({ label: c, type: 'column' })
  } else {
    for (const k of KEYWORDS) if (!w || k.toLowerCase().startsWith(w)) items.push({ label: k, type: 'keyword' })
    for (const t of suggestCache.value?.tables || []) if (!w || t.name.toLowerCase().startsWith(w)) items.push({ label: t.name, type: 'table' })
  }
  return items.slice(0, 30)
}

async function openSuggest(force = false) {
  await ensureSuggest()
  const { start, word, table } = currentWordAt(areaRef.value?.selectionStart ?? sql.value.length)
  const items = buildSuggestions(word, table)
  if (items.length === 0) { closeSuggest(); return }
  suggestStart = start
  suggestTable = table
  suggestList.value = items
  suggestIndex.value = 0
  showSuggest.value = true
}

function closeSuggest() {
  showSuggest.value = false
  suggestList.value = []
}

// 将补全项写入编辑器并聚焦
function pickSuggest(item: SuggestItem) {
  const area = areaRef.value
  const caret = area?.selectionStart ?? sql.value.length
  let insert = item.label
  if (item.type !== 'keyword') {
    insert = /^[A-Za-z_][A-Za-z0-9_]*$/.test(item.label) && !KEYWORDS.has(item.label.toUpperCase())
      ? item.label
      : `\`${item.label.replace(/`/g, '``')}\``
  }
  sql.value = sql.value.slice(0, suggestStart) + insert + sql.value.slice(caret)
  closeSuggest()
  nextTick(() => {
    const pos = suggestStart + insert.length
    if (area) { area.focus(); area.selectionStart = area.selectionEnd = pos }
  })
}

// ---- 执行 ----
async function run() {
  if (!sql.value.trim()) return
  loading.value = true
  err.value = ''
  message.value = ''
  const executed = sql.value
  try {
    const res = (await api.call('/api/query', { method: 'POST', body: { sql: executed } })) as any
    results.value = res.results || []
    activeResult.value = 0
    message.value = results.value.length ? `完成，共 ${results.value.length} 个结果集` : '完成'
    pushHistory(executed)
  } catch (e: any) {
    err.value = e?.data?.statusMessage || e?.message || String(e)
  } finally {
    loading.value = false
  }
}

// ---- 当前结果导出 CSV（客户端直接序列化，无需重查） ----
const exporting = ref(false)
function toCsv(rows: any[]): string {
  if (!rows.length) return '\uFEFF'
  const keys = Object.keys(rows[0])
  const cell = (v: any): string => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [keys.map(cell).join(',')]
  for (const r of rows) lines.push(keys.map(k => cell(r[k])).join(','))
  return '\uFEFF' + lines.join('\r\n')
}
function exportActive() {
  const r = results.value[activeResult.value]
  if (!r || r.type !== 'select') return
  exporting.value = true
  try {
    const blob = new Blob([toCsv(r.rows || [])], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `query_result_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  } finally {
    exporting.value = false
  }
}

// ---- 键盘事件 ----
function onKeydown(e: KeyboardEvent) {
  // 补全弹窗开启时的导航
  if (showSuggest.value) {
    if (e.key === 'ArrowDown') { e.preventDefault(); suggestIndex.value = (suggestIndex.value + 1) % suggestList.value.length; return }
    if (e.key === 'ArrowUp') { e.preventDefault(); suggestIndex.value = (suggestIndex.value - 1 + suggestList.value.length) % suggestList.value.length; return }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const item = suggestList.value[suggestIndex.value]
      if (item) pickSuggest(item)
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); closeSuggest(); return }
  }
  // 历史导航（编辑器为空时 ↑/↓ 翻阅）
  if (!showSuggest.value && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !sql.value.trim()) {
    e.preventDefault()
    if (history.value.length === 0) return
    historyIndex.value = e.key === 'ArrowUp'
      ? (historyIndex.value + 1) % history.value.length
      : (historyIndex.value <= 0 ? history.value.length - 1 : historyIndex.value - 1)
    const h = history.value[historyIndex.value]
    if (h !== undefined) sql.value = h
    return
  }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); return }
  if (e.key === ' ' && e.ctrlKey) { e.preventDefault(); openSuggest(true); return }
}

// 输入时延迟触发自动补全（排除纯空白输入）
function onInput() {
  if (suggestTimer) clearTimeout(suggestTimer)
  const caret = areaRef.value?.selectionStart ?? sql.value.length
  const before = sql.value.slice(0, caret)
  // 仅当最后字符是 . 或以字母/下划线开头的标识符片段时触发
  if (/[A-Za-z0-9_$]$/.test(before) || before.endsWith('.')) {
    suggestTimer = setTimeout(() => openSuggest(false), 160)
  } else {
    closeSuggest()
  }
}

function toggleHistory() {
  showHistory.value = !showHistory.value
  if (showHistory.value) historyIndex.value = -1
}

// 编辑器失焦时延迟关闭补全，避免点击补全项前已被移除
function onBlur() {
  setTimeout(closeSuggest, 150)
}

onMounted(() => {
  loadHistory()
  window.addEventListener('keydown', onGlobalKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  if (suggestTimer) clearTimeout(suggestTimer)
})
// 全局 Ctrl+Enter 执行（焦点不在编辑器时也可用）
function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target !== areaRef.value) {
    e.preventDefault()
    run()
  }
}
</script>

<template>
  <div class="ios-card">
    <div class="flex justify-between items-center px-4 h-12 border-b border-ios-sep">
      <h3 class="text-[15px] font-semibold text-ios-label">SQL 控制台</h3>
      <div class="flex items-center gap-2">
        <span class="text-xs text-ios-tertiary hidden sm:inline">Ctrl/⌘ + Enter 执行 · Ctrl+Space 补全</span>
        <button class="text-[13px] text-ios-blue font-medium hover:underline" @click="toggleHistory">历史</button>
      </div>
    </div>

    <div class="p-4 space-y-3">
      <!-- 历史下拉 -->
      <div v-if="showHistory" class="border border-ios-sep rounded-xl bg-white shadow-sm">
        <p v-if="!history.length" class="p-3 text-[13px] text-ios-tertiary">暂无历史记录</p>
        <ul v-else class="max-h-44 overflow-y-auto">
          <li v-for="(h, i) in history" :key="i" class="px-3 py-2 border-b border-ios-sep last:border-0 hover:bg-ios-fill/60 cursor-pointer">
            <button class="w-full text-left font-mono text-[12.5px] text-ios-label leading-snug break-all line-clamp-2" @click="sql = h; showHistory = false">{{ h }}</button>
          </li>
        </ul>
      </div>

      <!-- 高亮编辑器 -->
      <div class="relative border border-ios-sep rounded-xl bg-ios-fill/40 focus-within:border-ios-blue">
        <pre
          ref="preRef"
          aria-hidden="true"
          class="absolute inset-0 overflow-hidden p-3.5 font-mono text-[13px] leading-6 whitespace-pre-wrap break-all text-ios-label pointer-events-none"
          v-html="highlight(sql + '\n')"
        ></pre>
        <textarea
          ref="areaRef"
          v-model="sql"
          rows="6"
          spellcheck="false"
          placeholder="SELECT * FROM your_table LIMIT 100;"
          class="relative w-full bg-transparent p-3.5 font-mono text-[13px] leading-6 whitespace-pre-wrap break-all text-transparent caret-ios-blue outline-none resize-y placeholder:text-ios-quaternary"
          @input="onInput"
          @scroll="syncScroll"
          @keydown="onKeydown"
          @blur="onBlur"
        ></textarea>

        <!-- 补全弹窗 -->
        <div v-if="showSuggest" class="absolute left-3 right-3 bottom-full mb-1 z-10 max-h-48 overflow-y-auto rounded-xl border border-ios-sep bg-white shadow-xl">
          <ul>
            <li
              v-for="(it, i) in suggestList"
              :key="`${it.type}-${it.label}`"
              :class="i === suggestIndex ? 'bg-blue-50' : ''"
              class="px-3 py-1.5 flex items-center gap-2 cursor-pointer text-[13px]"
              @mousedown.prevent="pickSuggest(it)"
              @mouseenter="suggestIndex = i"
            >
              <span
                class="w-9 shrink-0 text-[10.5px] uppercase tracking-wide"
                :class="it.type === 'keyword' ? 'text-amber-500' : it.type === 'table' ? 'text-blue-500' : 'text-violet-500'"
              >{{ it.type }}</span>
              <span class="font-mono text-ios-label truncate">{{ it.label }}</span>
              <span v-if="it.type === 'table' && suggestTable === ''" class="ml-auto text-[11px] text-ios-tertiary truncate">{{ suggestCache?.database }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex gap-2 items-center">
        <UiButton variant="primary" :disabled="loading" @click="run">{{ loading ? '执行中…' : '执行' }}</UiButton>
        <span v-if="message" class="text-[13px] text-ios-secondary">{{ message }}</span>
        <span class="flex-1"></span>
        <UiButton v-if="results.length" variant="soft" size="sm" :disabled="exporting || results[activeResult]?.type !== 'select'" @click="exportActive">
          {{ exporting ? '导出中…' : '导出' }}
        </UiButton>
      </div>
      <p v-if="err" class="text-[13px] text-ios-red whitespace-pre-wrap break-all">{{ err }}</p>
    </div>

    <!-- 多结果集 -->
    <div v-if="results.length" class="border-t border-ios-sep">
      <div class="flex items-center gap-1 px-3 pt-2 overflow-x-auto">
        <button
          v-for="(r, i) in results"
          :key="i"
          class="px-3 py-1.5 text-[12.5px] rounded-t-lg whitespace-nowrap transition"
          :class="i === activeResult ? 'bg-ios-fill/90 text-ios-label font-semibold' : 'text-ios-secondary hover:text-ios-label'"
          @click="activeResult = i"
        >结果 {{ i + 1 }}<span v-if="r.type === 'select'" class="ml-1 text-[11px] text-ios-tertiary">{{ r.rowCount }} 行</span></button>
      </div>

      <template v-for="(r, i) in results" :key="i">
        <!-- SELECT 结果表格 -->
        <div v-if="i === activeResult && r.type === 'select'" class="overflow-x-auto max-h-[50vh] overflow-y-auto border-t border-ios-sep">
          <p v-if="!r.rows?.length" class="p-6 text-sm text-ios-tertiary text-center">无数据。</p>
          <table v-else class="w-full text-[13px] border-collapse">
            <thead class="sticky top-0 z-10">
              <tr class="bg-ios-fill/90 backdrop-blur-sm text-left">
                <th v-for="c in Object.keys(r.rows![0])" :key="c" class="px-3 py-2 font-semibold text-ios-tertiary text-xs uppercase tracking-wider whitespace-nowrap">{{ c }}</th>
              </tr>
            </thead>
            <tbody class="bg-ios-card">
              <tr v-for="(row, ri) in r.rows" :key="ri" class="odd:bg-white even:bg-[#f9f9fb] hover:bg-blue-50/40 transition-colors">
                <td v-for="c in Object.keys(r.rows![0])" :key="c" class="px-3 py-2 text-ios-label whitespace-nowrap align-top">{{ row[c] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 写语句结果 -->
        <p v-else-if="i === activeResult && r.type === 'affect'" class="px-4 py-6 text-sm text-ios-secondary border-t border-ios-sep">
          影响 {{ r.affectedRows }} 行<template v-if="r.insertId">，insertId = {{ r.insertId }}</template>
        </p>
      </template>
    </div>
  </div>
</template>
