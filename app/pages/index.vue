<script setup lang="ts">
const activeTab = ref<'conn' | 'data' | 'sql'>('conn')
const selectedTable = ref<{ database: string; name: string } | null>(null)
const showConnPanel = ref(true)

function onSelectTable(t: { database: string; name: string }) {
  selectedTable.value = t
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex flex-col">
    <header class="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
      <h1 class="font-semibold text-slate-800">MySQL Workbench</h1>
      <nav class="flex gap-1 text-sm">
        <button :class="activeTab === 'conn' ? 'bg-blue-600 text-white' : 'text-slate-600'" class="px-3 py-1.5 rounded-lg" @click="activeTab = 'conn'">连接</button>
        <button :class="activeTab === 'data' ? 'bg-blue-600 text-white' : 'text-slate-600'" class="px-3 py-1.5 rounded-lg" @click="activeTab = 'data'">数据</button>
        <button :class="activeTab === 'sql' ? 'bg-blue-600 text-white' : 'text-slate-600'" class="px-3 py-1.5 rounded-lg" @click="activeTab = 'sql'">SQL</button>
      </nav>
    </header>

    <!-- 顶部通栏广告位 -->
    <AdBanner />

    <main class="flex-1 p-4 max-w-6xl w-full mx-auto">
      <div v-if="activeTab === 'conn'">
        <ConnectionPanel @changed="showConnPanel = !showConnPanel" />
      </div>
      <div v-else-if="activeTab === 'data'" class="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ObjectBrowser @select-table="onSelectTable" />
        <DataGrid v-if="selectedTable" :database="selectedTable.database" :table="selectedTable.name" />
        <p v-else class="text-slate-400 text-sm self-start">在左侧选择一张表查看数据。</p>
      </div>
      <div v-else>
        <SqlConsole />
      </div>
    </main>

    <!-- 页脚版权与备案 -->
    <AppFooter />
  </div>
</template>