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

    <main class="flex-1 p-4 max-w-6xl w-full mx-auto">
      <div v-if="activeTab === 'conn'">
        <ConnectionPanel @changed="showConnPanel = !showConnPanel" />
      </div>
      <div v-else-if="activeTab === 'data'">
        <p class="text-slate-400 text-sm">数据浏览：扩展到对象树与数据网格（后续任务）。当前选中表：{{ selectedTable ? selectedTable.database + '.' + selectedTable.name : '未选择' }}</p>
      </div>
      <div v-else>
        <p class="text-slate-400 text-sm">SQL 控制台（后续任务填充）。</p>
      </div>
    </main>
  </div>
</template>