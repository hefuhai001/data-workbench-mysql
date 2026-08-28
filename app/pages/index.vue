<script setup lang="ts">
const activeTab = ref<'conn' | 'data' | 'sql'>('conn')
const selectedTable = ref<{ database: string; name: string } | null>(null)
const showConnPanel = ref(true)

function onSelectTable(t: { database: string; name: string }) {
  selectedTable.value = t
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航：毛玻璃 iOS 风格 -->
    <header class="sticky top-0 z-30 border-b border-black/5 backdrop-blur-xl bg-ios-bg/80">
      <div class="mx-auto w-full max-w-6xl px-4 py-2.5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-2 shrink-0">
          <div class="grid place-items-center size-7 rounded-[7px] bg-ios-blue text-white text-[13px]">DB</div>
          <h1 class="text-[15px] font-semibold tracking-tight text-ios-label">Workbench</h1>
        </div>

        <!-- 分段控件 -->
        <nav class="ios-segmented shrink-0" aria-label="主导航">
          <button :class="activeTab === 'conn' && 'active'" @click="activeTab = 'conn'">连接</button>
          <button :class="activeTab === 'data' && 'active'" @click="activeTab = 'data'">数据</button>
          <button :class="activeTab === 'sql' && 'active'" @click="activeTab = 'sql'">SQL</button>
        </nav>

        <span class="hidden sm:block text-xs text-ios-tertiary shrink-0">MySQL</span>
      </div>
    </header>

    <!-- 顶部通栏广告位 -->
    <AdBanner />

    <main class="flex-1 mx-auto w-full max-w-6xl px-4 py-4">
      <div v-if="activeTab === 'conn'">
        <ConnectionPanel @changed="showConnPanel = !showConnPanel" />
      </div>

      <div v-else-if="activeTab === 'data'" class="grid gap-4 lg:grid-cols-[282px_1fr]">
        <!-- 侧边栏：分组卡片 -->
        <aside class="lg:sticky lg:top-[68px] lg:self-start">
          <ObjectBrowser @select-table="onSelectTable" />
        </aside>

        <div>
          <DataGrid v-if="selectedTable" :database="selectedTable.database" :table="selectedTable.name" />
          <p v-else class="mx-auto mt-16 text-sm text-ios-tertiary text-center">
            在左侧选择一张表查看数据
          </p>
        </div>
      </div>

      <div v-else>
        <SqlConsole />
      </div>
    </main>

    <!-- 页脚版权与备案 -->
    <AppFooter />
  </div>
</template>