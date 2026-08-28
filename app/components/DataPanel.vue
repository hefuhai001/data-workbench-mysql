<script setup lang="ts">
// 右侧内容区：按激活项类型渲染 数据网格/表列表/库列表/SQL 控制台，并展示面包屑
const { activeKey, findNode, toggleNode, selectNode } = useWorkbench()

const activeNode = computed<WbNode | null>(() => {
  if (!activeKey.value || activeKey.value === 'sql') return null
  return findNode(activeKey.value)
})

const connName = computed(() => {
  const c = activeNode.value ? findNode(`conn:${activeNode.value.connId}`) : null
  return c?.name || ''
})

// 兜底：经 tag 激活且从未展开过的连接/数据库，自动加载其子级
watch(activeNode, (n) => {
  if (n && (n.type === 'connection' || n.type === 'database') && !n.loaded && !n.loading) {
    toggleNode(n)
  }
})

function onSelectDbChild(node: WbNode) {
  toggleNode(node)
  selectNode(node)
}
</script>

<template>
  <div class="p-4 space-y-3">
    <!-- 面包屑 -->
    <nav v-if="activeNode" class="flex items-center gap-1.5 text-[13px] text-ios-secondary flex-wrap">
      <template v-if="activeNode.type === 'connection'">
        <span class="text-ios-label font-medium">{{ activeNode.name }}</span>
      </template>
      <template v-else-if="activeNode.type === 'database'">
        <span class="hover:text-ios-blue">{{ connName }}</span>
        <span class="text-ios-quaternary">/</span>
        <span class="text-ios-label font-medium">{{ activeNode.name }}</span>
      </template>
      <template v-else>
        <span class="hover:text-ios-blue">{{ connName }}</span>
        <span class="text-ios-quaternary">/</span>
        <span class="hover:text-ios-blue">{{ activeNode.db }}</span>
        <span class="text-ios-quaternary">/</span>
        <span class="text-ios-label font-medium">{{ activeNode.name }}</span>
      </template>
    </nav>

    <!-- 内容 -->
    <template v-if="activeKey === 'sql'">
      <SqlConsole />
    </template>

    <template v-else-if="activeNode">
      <!-- 数据表：数据网格 + 搜索 -->
      <DataGrid
        v-if="activeNode.type === 'table'"
        :connection-id="activeNode.connId"
        :database="activeNode.db"
        :table="activeNode.name"
        :title="`${activeNode.db}.${activeNode.name}`"
      />
      <!-- 数据库：列出数据表 -->
      <NodeList
        v-else-if="activeNode.type === 'database'"
        title="数据表"
        type="table"
        :items="activeNode.children"
        @select="selectNode"
      />
      <!-- 连接：列出数据库 -->
      <NodeList
        v-else
        title="数据库"
        type="database"
        :items="activeNode.children"
        @select="onSelectDbChild"
      />
    </template>

    <!-- 空状态 -->
    <div v-else class="grid place-items-center py-32 text-center">
      <div class="space-y-3">
        <svg class="mx-auto size-14 text-ios-quaternary" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L2 8l10 5 10-5-10-5zm10 10.5L12 20 2 13.5V11l10 5 10-5v2.5z" stroke="currentColor" stroke-width="1.4"/>
        </svg>
        <p class="text-sm text-ios-tertiary">从左侧选择连接 / 数据库 / 数据表开始浏览</p>
      </div>
    </div>
  </div>
</template>
