<script setup lang="ts">
const { init, sidebarOpen } = useWorkbench()

onMounted(init)
</script>

<template>
  <div class="h-screen flex flex-col bg-ios-bg">
    <!-- 页面居中提示 -->
    <ToastHost />

    <!-- 顶部导航：品牌 + 点击生成的 tag -->
    <AppHeader />

    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏：连接 > 数据库 > 数据表（移动端为抽屉） -->
      <SidebarTree
        class="fixed inset-y-0 left-0 z-40 -translate-x-full transition-transform duration-200 md:static md:translate-x-0 md:z-auto"
        :class="sidebarOpen && 'translate-x-0'"
      />
      <!-- 移动端抽屉遮罩 -->
      <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/30 md:hidden" @click="sidebarOpen = false" />

      <!-- 右侧：数据 + 搜索 -->
      <main class="flex-1 min-w-0 overflow-y-auto">
        <DataPanel />
        <AppFooter />
      </main>
    </div>
  </div>
</template>
