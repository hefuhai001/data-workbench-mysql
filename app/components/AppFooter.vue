<script setup lang="ts">
// 页脚信息集中配置，备案号就绪后直接替换
const footer = {
  company: 'Data Workbench MySQL',
  year: '2026',
  icp: '京ICP备XXXXXXXX号'
}
</script>

<template>
  <footer class="mt-6 border-t border-black/5 px-4 py-5">
    <div class="mx-auto max-w-6xl text-center text-xs text-ios-tertiary">
      <p>© {{ footer.year }} {{ footer.company }}</p>
      <p class="mt-1">{{ footer.icp }}</p>
    </div>
  </footer>
</template>
