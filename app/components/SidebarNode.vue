<script setup lang="ts">
// 侧边栏树递归节点：连接/数据库/数据表 单行，负责展开加载子级、选中激活、悬停操作与备注
const props = defineProps<{ node: WbNode; depth?: number }>()
const emit = defineEmits<{
  'edit-conn': [WbNode]
  'delete-conn': [WbNode]
  'test-conn': [WbNode]
  note: [WbNode]
}>()

const { activeKey, notes, toggleNode, selectNode, sidebarOpen } = useWorkbench()

const isActive = computed(() => activeKey.value === props.node.key)
const noteText = computed(() => notes.value[props.node.key] || '')

function onClick() {
  if (props.node.type === 'table') {
    selectNode(props.node)
    sidebarOpen.value = false // 移动端选择表后收起抽屉
  } else {
    // 连接 / 数据库：展开并在右侧展示其子级
    toggleNode(props.node)
    selectNode(props.node)
  }
}

const rowPad = computed(() => 8 + (props.depth || 0) * 6)
const childMargin = computed(() => rowPad.value + 8)
</script>

<template>
  <div>
    <!-- 节点行 -->
    <div
      class="ios-sidebar-row group gap-1 pr-1.5"
      :class="isActive && 'active'"
      :style="{ paddingLeft: rowPad + 'px' }"
      @click="onClick"
    >
      <!-- 展开箭头 / 占位 -->
      <svg v-if="node.type !== 'table'" class="size-3.5 shrink-0 text-ios-tertiary transition-transform duration-150"
        :class="node.expanded && 'rotate-90'" viewBox="0 0 24 24" fill="none">
        <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span v-else class="w-3.5 shrink-0" />

      <!-- 加载态 / 类型图标 -->
      <span v-if="node.loading" class="tree-spinner shrink-0 size-4" />
      <svg v-else-if="node.type === 'connection'" class="size-4 shrink-0 text-ios-orange" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L2 8l10 5 10-5-10-5zm10 10.5L12 20 2 13.5V11l10 5 10-5v2.5z"/>
      </svg>
      <svg v-else-if="node.type === 'database'" class="size-4 shrink-0 text-ios-blue" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L2 8l10 5 10-5-10-5zm10 10.5L12 20 2 13.5V11l10 5 10-5v2.5z"/>
      </svg>
      <svg v-else-if="node.subtype === 'view'" class="size-3.5 shrink-0 text-ios-tertiary" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4a8 8 0 110 16H7a1 1 0 01-1-1V9a5 5 0 010-10h6zm1 10V8h-2v6h2zm0 4h-2v2h2v-2z"/>
      </svg>
      <svg v-else class="size-3.5 shrink-0 text-ios-blue" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 5a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
      </svg>

      <!-- 名称 + 备注 -->
      <span class="min-w-0 flex-1 leading-tight">
        <span class="block truncate">{{ node.name }}</span>
        <span v-if="noteText" class="sub block truncate text-[11px] opacity-70">✎ {{ noteText }}</span>
      </span>

      <!-- 连接行操作：悬停显示 -->
      <template v-if="node.type === 'connection'">
        <button class="row-action" @click.stop="emit('test-conn', node)">测试</button>
        <button class="row-action" @click.stop="emit('edit-conn', node)">编辑</button>
        <button class="row-action row-action-danger" @click.stop="emit('delete-conn', node)">删除</button>
      </template>

      <!-- 备注按钮 -->
      <button class="row-note shrink-0" :class="noteText && 'has-note'" title="备注"
        @click.stop="emit('note', node)">
        <svg class="size-3.5" viewBox="0 0 24 24" fill="none">
          <path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M13.5 6.5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 子级 -->
    <div v-if="node.expanded && node.children.length" class="border-l border-ios-sep"
      :style="{ marginLeft: childMargin + 'px' }">
      <SidebarNode
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :depth="(depth || 0) + 1"
        @edit-conn="emit('edit-conn', $event)"
        @delete-conn="emit('delete-conn', $event)"
        @test-conn="emit('test-conn', $event)"
        @note="emit('note', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-spinner {
  border: 2px solid rgba(0, 122, 255, 0.25);
  border-top-color: var(--color-ios-blue);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.row-action {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-ios-blue);
  opacity: 0;
  transition: opacity 0.12s;
  white-space: nowrap;
  padding: 0 3px;
}
.ios-sidebar-row:hover .row-action { opacity: 1; }
.ios-sidebar-row.active .row-action { color: #fff; }
.row-action-danger { color: var(--color-ios-red); }
.ios-sidebar-row.active .row-action-danger { color: #ffd6d3; }

.row-note {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  color: var(--color-ios-quaternary);
  opacity: 0;
  transition: opacity 0.12s;
}
.ios-sidebar-row:hover .row-note { opacity: 1; }
.row-note.has-note {
  opacity: 1;
  color: var(--color-ios-blue);
}
.ios-sidebar-row.active .row-note { color: rgba(255, 255, 255, 0.85); }
</style>
