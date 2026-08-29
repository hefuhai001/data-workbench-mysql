// 后台工作台核心状态：连接>数据库>数据表 树、顶部导航 tag、当前激活项、备注、连接管理。
// 通过 useState 全局共享，供侧边栏 / 顶部导航 / 内容区各组件复用。

export interface WbNode {
  key: string // conn:<id> | db:<connId>:<db> | table:<connId>:<db>:<table>
  type: 'connection' | 'database' | 'table'
  name: string
  connId: string
  db: string
  subtype: string // 表节点：'table' | 'view'
  host?: string
  port?: number
  user?: string
  defaultDatabase?: string
  expanded: boolean
  loading: boolean
  loaded: boolean
  children: WbNode[]
}

export interface WbTab {
  key: string
  type: WbNode['type'] | 'sql'
  label: string
}

// 持久化（localStorage）只绑定一次，避免多个组件调用 useWorkbench 时重复注册 watcher
let persistenceBound = false

export function useWorkbench() {
  const api = useApi()
  const { notes, loadNotes, saveNote } = useNotes()
  const { success } = useToast()

  const tree = useState<WbNode[]>('wb-tree', () => [])
  const tabs = useState<WbTab[]>('wb-tabs', () => [])
  const activeKey = useState<string>('wb-active', () => '')
  const sidebarOpen = useState<boolean>('wb-sidebar', () => false)
  const treeLoading = useState<boolean>('wb-tree-loading', () => false)

  // 收集当前所有已展开节点的 key（用于持久化展开状态）
  const expandedKeys = computed(() => {
    const out: string[] = []
    const walk = (nodes: WbNode[]) => nodes.forEach(n => { if (n.expanded) { out.push(n.key); walk(n.children) } })
    walk(tree.value)
    return out
  })

  // 监听变化自动写入 localStorage，刷新后恢复
  if (process.client && !persistenceBound) {
    persistenceBound = true
    watch(tabs, v => localStorage.setItem('wb-tabs', JSON.stringify(v)), { deep: true })
    watch(activeKey, v => localStorage.setItem('wb-active', v || ''))
    watch(expandedKeys, v => localStorage.setItem('wb-expanded', JSON.stringify(v)))
  }

  async function init() {
    try {
      await Promise.all([loadNotes(), restoreTree()])
    } catch {
      // 401 未解锁等错误已由 useApi 处理并跳转 /unlock，这里仅避免 unhandled rejection
    }
  }

  // 刷新后恢复：展开状态 + 顶部 tag + 当前激活项（从 localStorage 读取）
  async function restoreTree() {
    await loadTree()
    if (!process.client) return

    let savedTabs: WbTab[] = []
    let savedExpanded: string[] = []
    let savedActive = ''
    try {
      savedTabs = JSON.parse(localStorage.getItem('wb-tabs') || '[]')
      savedExpanded = JSON.parse(localStorage.getItem('wb-expanded') || '[]')
      savedActive = localStorage.getItem('wb-active') || ''
    } catch {
      // 忽略损坏的本地数据
    }

    // 过滤掉对应连接已不存在的 tag（连接被删除后不应残留）
    const connIds = new Set(tree.value.map(n => n.connId))
    tabs.value = savedTabs.filter(t => {
      if (t.type === 'sql') return true
      if (t.type === 'connection') return connIds.has(t.key.slice(5))
      return connIds.has(t.key.split(':')[1] || '')
    })

    // 先加载所有需要展示/展开节点的祖先链，再恢复展开状态与激活项
    const need = new Set<string>([...savedExpanded, ...tabs.value.map(t => t.key)])
    for (const key of need) await ensureNodeChain(key)
    for (const key of savedExpanded) {
      const n = findNode(key)
      if (n) n.expanded = true
    }
    if (savedActive && tabs.value.some(t => t.key === savedActive)) {
      activeKey.value = savedActive
    }
  }

  // 按 key 类型加载其祖先链并展开目标节点（key 形如 conn:x / db:cid:name / table:cid:db:name）
  async function ensureNodeChain(key: string) {
    const parts = key.split(':')
    if (parts[0] === 'conn') {
      const conn = tree.value.find(n => n.key === key)
      if (conn) {
        conn.expanded = true
        if (!conn.loaded && !conn.loading) await toggleNode(conn)
      }
      return
    }
    const conn = tree.value.find(n => n.connId === parts[1])
    if (!conn) return
    conn.expanded = true
    if (!conn.loaded && !conn.loading) await toggleNode(conn)
    const db = conn.children.find(n => n.name === parts[2])
    if (!db) return
    db.expanded = true
    if (!db.loaded && !db.loading) await toggleNode(db)
  }

  // 重建连接层，同时按 key 保留已展开/已加载的子节点，避免刷新丢展开状态
  async function loadTree() {
    treeLoading.value = true
    try {
      const conns = (await api.call('/api/connections')) as any[]
      const prev = new Map(tree.value.map(n => [n.key, n]))
      tree.value = conns.map((c: any) => {
        const key = `conn:${c.id}`
        const p = prev.get(key)
        return {
          key,
          type: 'connection',
          name: c.name,
          connId: c.id,
          db: '',
          subtype: '',
          host: c.host,
          port: c.port,
          user: c.user,
          defaultDatabase: c.defaultDatabase,
          expanded: p?.expanded || false,
          loading: false,
          loaded: p?.loaded || false,
          children: p?.children || []
        } as WbNode
      })
    } finally {
      treeLoading.value = false
    }
  }

  function findNode(key: string, nodes: WbNode[] = tree.value): WbNode | null {
    for (const n of nodes) {
      if (n.key === key) return n
      const f = findNode(key, n.children)
      if (f) return f
    }
    return null
  }

  // 展开某个 key 的全部祖先节点（用于点击顶部 tag 时联动侧边栏高亮）
  function expandAncestors(key: string) {
    const walk = (nodes: WbNode[]): boolean => {
      for (const n of nodes) {
        if (n.key === key) return true
        if (walk(n.children)) {
          n.expanded = true
          return true
        }
      }
      return false
    }
    walk(tree.value)
  }

  // 展开/收起连接或数据库（首次展开时懒加载子级）
  async function toggleNode(node: WbNode) {
    if (node.type === 'table') {
      await selectNode(node)
      return
    }
    if (node.loaded) {
      node.expanded = !node.expanded
      return
    }
    node.loading = true
    try {
      if (node.type === 'connection') {
        const dbs = (await api.call(`/api/databases?connectionId=${encodeURIComponent(node.connId)}`)) as any[]
        node.children = dbs.map((d: any) => ({
          key: `db:${node.connId}:${d.name}`,
          type: 'database',
          name: d.name,
          connId: node.connId,
          db: d.name,
          subtype: '',
          expanded: false,
          loading: false,
          loaded: false,
          children: []
        } as WbNode))
      } else {
        const tables = (await api.call(`/api/databases/${encodeURIComponent(node.db)}/tables?connectionId=${encodeURIComponent(node.connId)}`)) as any[]
        node.children = tables.map((t: any) => ({
          key: `table:${node.connId}:${node.db}:${t.name}`,
          type: 'table',
          name: t.name,
          connId: node.connId,
          db: node.db,
          subtype: t.type === 'BASE TABLE' ? 'table' : 'view',
          expanded: false,
          loading: false,
          loaded: false,
          children: []
        } as WbNode))
      }
      node.loaded = true
      node.expanded = true
    } finally {
      node.loading = false
    }
  }

  function addTab(node: WbNode) {
    const label = node.type === 'table' ? `${node.db}.${node.name}` : node.name
    if (!tabs.value.some(t => t.key === node.key)) {
      tabs.value.push({ key: node.key, type: node.type, label })
    }
  }

  // 选中节点：设为激活 + 生成顶部 tag；选表时同步当前会话连接
  async function selectNode(node: WbNode) {
    activeKey.value = node.key
    addTab(node)
    if (node.type === 'table') {
      await api.call(`/api/connections/${node.connId}/switch`, { method: 'POST' }).catch(() => {})
    }
  }

  // 点击顶部 tag：联动展开侧边栏祖先并激活对应内容
  function activateKey(key: string) {
    if (!tabs.value.some(t => t.key === key)) return
    if (key === 'sql') {
      activeKey.value = key
      return
    }
    expandAncestors(key)
    const node = findNode(key)
    if (node) {
      activeKey.value = key
      if (node.type === 'table') {
        api.call(`/api/connections/${node.connId}/switch`, { method: 'POST' }).catch(() => {})
      }
    }
  }

  function closeTab(key: string) {
    tabs.value = tabs.value.filter(t => t.key !== key)
    if (activeKey.value === key) {
      const last = tabs.value[tabs.value.length - 1]
      if (last) activateKey(last.key)
      else activeKey.value = ''
    }
  }

  // ---- tag 批量关闭：关闭左侧 / 右侧 / 其他 / 全部 ----
  function closeLeft(key: string) {
    const idx = tabs.value.findIndex(t => t.key === key)
    if (idx <= 0) return
    const closed = tabs.value.slice(0, idx).map(t => t.key)
    tabs.value = tabs.value.slice(idx)
    // 当前激活项在左侧被关闭时，激活右键的那个 tag
    if (closed.includes(activeKey.value)) activateKey(key)
  }

  function closeRight(key: string) {
    const idx = tabs.value.findIndex(t => t.key === key)
    if (idx < 0 || idx === tabs.value.length - 1) return
    tabs.value = tabs.value.slice(0, idx + 1)
    // 当前激活项在右侧被关闭时，回退到右键的那个 tag
    if (!tabs.value.some(t => t.key === activeKey.value)) activateKey(key)
  }

  function closeOthers(key: string) {
    if (!tabs.value.some(t => t.key === key)) return
    tabs.value = tabs.value.filter(t => t.key === key)
    activateKey(key)
  }

  function closeAll() {
    tabs.value = []
    activeKey.value = ''
  }

  function openSql() {
    if (!tabs.value.some(t => t.key === 'sql')) {
      tabs.value.push({ key: 'sql', type: 'sql', label: 'SQL 控制台' })
    }
    activeKey.value = 'sql'
  }

  // ---- 连接管理 ----
  function emptyConnectionForm() {
    return { name: '', host: '', port: '3306', user: '', password: '', defaultDatabase: '' }
  }

  async function saveConnection(form: Record<string, any>, id?: string) {
    const body = {
      name: form.name,
      host: form.host,
      port: Number(form.port),
      user: form.user,
      defaultDatabase: form.defaultDatabase || '',
      password: form.password || ''
    }
    if (id) await api.call(`/api/connections/${id}`, { method: 'PUT', body })
    else await api.call('/api/connections', { method: 'POST', body })
    await loadTree()
  }

  async function deleteConnection(node: WbNode) {
    if (!confirm(`删除连接「${node.name}」？`)) return false
    await api.call(`/api/connections/${node.connId}`, { method: 'DELETE' })
    const own = `conn:${node.connId}`
    tabs.value = tabs.value.filter(t =>
      t.key !== own && !t.key.startsWith(`db:${node.connId}:`) && !t.key.startsWith(`table:${node.connId}:`))
    if (activeKey.value === own || activeKey.value.startsWith(`db:${node.connId}:`) || activeKey.value.startsWith(`table:${node.connId}:`)) {
      activeKey.value = ''
    }
    await loadTree()
    success(`连接「${node.name}」已删除`)
    return true
  }

  async function testConnection(node: WbNode) {
    const res = (await api.call(`/api/connections/${node.connId}/test`, { method: 'POST' })) as any
    return res?.message || '连接成功'
  }

  return {
    tree, tabs, activeKey, sidebarOpen, treeLoading, notes, saveNote,
    init, loadTree, findNode, toggleNode, selectNode, activateKey, closeTab,
    closeLeft, closeRight, closeOthers, closeAll, openSql,
    emptyConnectionForm, saveConnection, deleteConnection, testConnection
  }
}
