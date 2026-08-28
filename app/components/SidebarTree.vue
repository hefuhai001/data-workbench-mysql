<script setup lang="ts">
// 左侧侧边栏：连接>数据库>数据表 树，含连接新增/编辑/删除/测试、SQL 控制台入口与备注弹窗
const { tree, treeLoading, loadTree, openSql, deleteConnection, testConnection } = useWorkbench()
const { success, error } = useToast()

const showConnForm = ref(false)
const connInitial = ref<Record<string, any> | null>(null)
const noteNode = ref<WbNode | null>(null)
const testing = ref<Record<string, boolean>>({})

function openNew() {
  connInitial.value = null
  showConnForm.value = true
}

function openEdit(node: WbNode) {
  connInitial.value = {
    id: node.connId,
    name: node.name,
    host: node.host || '',
    port: node.port ?? '',
    user: node.user || '',
    defaultDatabase: node.defaultDatabase || ''
  }
  showConnForm.value = true
}

async function onTest(node: WbNode) {
  testing.value[node.connId] = true
  try {
    const msg = await testConnection(node)
    success(`「${node.name}」连接成功`)
  } catch (e: any) {
    error(`「${node.name}」连接失败：${e?.data?.statusMessage || e?.message || String(e)}`)
  } finally {
    testing.value[node.connId] = false
  }
}
</script>

<template>
  <aside class="flex w-64 flex-col bg-white border-r border-ios-sep">
    <!-- 侧边栏头部 -->
    <div class="flex items-center justify-between px-3 h-12 shrink-0 border-b border-ios-sep">
      <h2 class="text-[15px] font-semibold text-ios-label flex items-center gap-1.5">
        <svg class="size-4 text-ios-blue" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 8l10 5 10-5-10-5zm10 10.5L12 20 2 13.5V11l10 5 10-5v2.5z"/>
        </svg>
        连接
      </h2>
      <div class="flex items-center gap-1">
        <button class="icon-btn" title="刷新" @click="loadTree">
          <svg class="size-4" viewBox="0 0 24 24" fill="none">
            <path d="M20 11A8 8 0 106 15.3M4 13a8 8 0 1014-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <UiButton variant="primary" size="sm" @click="openNew">＋ 新增</UiButton>
      </div>
    </div>

    <!-- 树区域 -->
    <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
      <p v-if="treeLoading" class="px-3 py-6 text-sm text-ios-tertiary text-center">加载中…</p>
      <template v-else-if="tree.length">
        <SidebarNode
          v-for="conn in tree"
          :key="conn.key"
          :node="conn"
          :depth="0"
          @test-conn="onTest"
          @edit-conn="openEdit"
          @delete-conn="deleteConnection"
          @note="noteNode = $event"
        />
      </template>
      <p v-else class="px-3 py-8 text-sm text-ios-tertiary text-center leading-relaxed">
        暂无连接
        <br />点击「＋ 新增」添加一个 MySQL 连接
      </p>
    </div>

    <!-- 底部：SQL 控制台入口 -->
    <div class="shrink-0 border-t border-ios-sep p-2">
      <button class="sql-entry" @click="openSql">
        <svg class="size-4" viewBox="0 0 24 24" fill="none">
          <path d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M4 6v12c0 1.1 3.6 2 8 2s8-.9 8-2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M4 12c0 1.1 3.6 2 8 2s8-.9 8-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        SQL 控制台
        <span class="ml-auto text-[11px] text-ios-tertiary">Ctrl/⌘+Enter</span>
      </button>
    </div>

    <!-- 连接编辑弹窗 -->
    <ConnectionForm v-if="showConnForm" :initial="connInitial" @close="showConnForm = false" />

    <!-- 备注弹窗 -->
    <NoteEditor v-if="noteNode" :node="noteNode" @close="noteNode = null" />
  </aside>
</template>

<style scoped>
.icon-btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  color: var(--color-ios-secondary);
  transition: background-color 0.12s, color 0.12s;
}
.icon-btn:hover {
  background-color: var(--color-ios-fill);
  color: var(--color-ios-label);
}
.sql-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ios-blue);
  transition: background-color 0.12s;
  text-align: left;
}
.sql-entry:hover {
  background-color: rgba(0, 122, 255, 0.08);
}
</style>
