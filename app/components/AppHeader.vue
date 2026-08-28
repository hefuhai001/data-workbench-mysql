<script setup lang="ts">
// 顶部导航栏：品牌区 + 第二行展示点击生成的 tag 标签（可点击切换/关闭，滚轮可横向滚动）
const { tabs, activeKey, activateKey, closeTab, sidebarOpen, loadTree } = useWorkbench()

const tagRef = ref<HTMLElement | null>(null)

// 鼠标滚轮悬停在 tag 栏上时横向滚动（默认纵向滚轮不会滚动横向溢出内容）
function onTagWheel(e: WheelEvent) {
  const el = tagRef.value
  if (!el) return
  if (e.deltaY !== 0) {
    el.scrollLeft += e.deltaY
    e.preventDefault()
  }
}
</script>

<template>
  <header class="shrink-0 bg-white/90 backdrop-blur-xl border-b border-ios-sep">
    <!-- 顶栏第一行：品牌 + 操作 -->
    <div class="flex items-center gap-2 px-3 h-12">
      <!-- 移动端侧边栏开关 -->
      <button class="grid place-items-center size-8 rounded-lg text-ios-secondary hover:bg-ios-fill md:hidden"
        @click="sidebarOpen = !sidebarOpen">
        <svg class="size-5" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="flex items-center gap-2">
        <div class="grid place-items-center size-7 rounded-[7px] bg-ios-blue text-white text-[13px]">DB</div>
        <h1 class="text-[15px] font-semibold tracking-tight text-ios-label hidden sm:block">Data Workbench</h1>
      </div>

      <div class="ml-auto flex items-center gap-1.5">
        <span class="hidden sm:inline text-xs text-ios-tertiary">MySQL</span>
        <button class="grid place-items-center size-8 rounded-lg text-ios-secondary hover:bg-ios-fill" title="刷新连接树"
          @click="loadTree">
          <svg class="size-4" viewBox="0 0 24 24" fill="none">
            <path d="M20 11A8 8 0 106 15.3M4 13a8 8 0 1014-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 顶栏第二行：点击过的 tag -->
    <div ref="tagRef" class="flex items-center gap-1.5 px-3 h-10 border-t border-ios-sep overflow-x-auto tag-scroll"
      @wheel="onTagWheel">
      <span v-if="!tabs.length" class="text-xs text-ios-tertiary whitespace-nowrap">在左侧点击连接 / 数据库 / 数据表，将在这里生成标签</span>
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tag"
        :class="activeKey === t.key && 'active'"
        @click="activateKey(t.key)"
      >
        <!-- 类型图标 -->
        <svg v-if="t.type === 'connection'" class="size-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 8l10 5 10-5-10-5zm10 10.5L12 20 2 13.5V11l10 5 10-5v2.5z"/>
        </svg>
        <svg v-else-if="t.type === 'database'" class="size-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 8l10 5 10-5-10-5zm10 10.5L12 20 2 13.5V11l10 5 10-5v2.5z"/>
        </svg>
        <svg v-else-if="t.type === 'table'" class="size-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 5a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
        </svg>
        <svg v-else class="size-3.5" viewBox="0 0 24 24" fill="none">
          <path d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M4 6v12c0 1.1 3.6 2 8 2s8-.9 8-2V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>

        <span class="max-w-[140px] truncate">{{ t.label }}</span>
        <span class="tag-close" title="关闭" @click.stop="closeTab(t.key)">✕</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.tag-scroll::-webkit-scrollbar { display: none; }
.tag-scroll { scrollbar-width: none; }

.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 4px 6px 4px 9px;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-ios-secondary);
  border: 1px solid transparent;
  transition: background-color 0.12s, color 0.12s;
}
.tag:hover {
  background-color: var(--color-ios-fill);
  color: var(--color-ios-label);
}
.tag.active {
  background-color: var(--color-ios-blue);
  border-color: var(--color-ios-blue-dark);
  color: #fff;
}
.tag-close {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  font-size: 10px;
  color: inherit;
  opacity: 0.6;
}
.tag-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.12);
}
.tag.active .tag-close:hover {
  background-color: rgba(255, 255, 255, 0.25);
}
</style>
