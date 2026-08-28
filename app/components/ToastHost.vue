<script setup lang="ts">
// 页面居中提示宿主：集中渲染成功/失败 toast 消息（测试连接、保存/删除等操作的反馈）
const { toasts } = useToast()
</script>

<template>
  <!-- 页面居中提示：固定顶部居中，悬浮于所有层级之上 -->
  <div class="pointer-events-none fixed top-4 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex items-center gap-2.5 rounded-full border bg-white/95 backdrop-blur px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        :class="t.type === 'error' ? 'border-ios-red/40' : 'border-emerald-300/60'"
      >
        <svg v-if="t.type === 'success'" class="size-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15"/>
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else class="size-4 shrink-0 text-ios-red" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.12"/>
          <path d="M12 7.5v5.5M12 15.5v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="text-[13px] font-medium text-ios-label max-w-[70vw]">{{ t.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
</style>
