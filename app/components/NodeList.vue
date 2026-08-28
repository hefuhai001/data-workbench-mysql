<script setup lang="ts">
// 可搜索的节点列表：展示某连接下的数据库列表，或某数据库下的数据表列表
const props = defineProps<{ title: string; items: WbNode[]; type: 'database' | 'table' }>()
const emit = defineEmits<{ select: [WbNode] }>()
const { notes } = useWorkbench()

const q = ref('')
const filtered = computed(() => {
  const kw = q.value.trim().toLowerCase()
  if (!kw) return props.items
  return props.items.filter(i => i.name.toLowerCase().includes(kw))
})
</script>

<template>
  <div class="ios-card">
    <div class="flex justify-between items-center px-4 h-12 border-b border-ios-sep">
      <h3 class="text-[15px] font-semibold text-ios-label truncate">{{ title }}</h3>
      <span class="text-xs text-ios-tertiary shrink-0">{{ type === 'database' ? '数据库' : '数据表' }} · {{ items.length }}</span>
    </div>

    <div class="px-4 py-3">
      <input
        v-model="q"
        type="text"
        :placeholder="`搜索${type === 'database' ? '数据库' : '数据表'}名称…`"
        class="ios-input text-sm"
      />
    </div>

    <div class="max-h-[60vh] overflow-y-auto divide-y divide-ios-sep">
      <p v-if="!filtered.length" class="px-4 py-8 text-sm text-ios-tertiary text-center">无匹配项。</p>
      <button
        v-for="item in filtered"
        :key="item.key"
        class="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-ios-highlight transition-colors"
        @click="emit('select', item)"
      >
        <svg v-if="type === 'database'" class="size-4 shrink-0 text-ios-blue" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 8l10 5 10-5-10-5zm10 10.5L12 20 2 13.5V11l10 5 10-5v2.5z"/>
        </svg>
        <svg v-else-if="item.subtype === 'view'" class="size-3.5 shrink-0 text-ios-tertiary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4a8 8 0 110 16H7a1 1 0 01-1-1V9a5 5 0 010-10h6zm1 10V8h-2v6h2zm0 4h-2v2h2v-2z"/>
        </svg>
        <svg v-else class="size-3.5 shrink-0 text-ios-blue" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 5a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
        </svg>
        <span class="min-w-0 flex-1 leading-tight">
          <span class="block truncate text-sm text-ios-label">{{ item.name }}</span>
          <span v-if="notes[item.key]" class="block truncate text-xs text-ios-secondary">✎ {{ notes[item.key] }}</span>
        </span>
        <svg class="size-3.5 shrink-0 text-ios-quaternary" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>
