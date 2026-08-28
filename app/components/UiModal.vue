<script setup lang="ts">
defineProps<{ title?: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <!-- 底部弹出卡片式弹窗 -->
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px] p-0 sm:items-center sm:p-5"
    @click.self="emit('close')">
    <div class="ios-card w-full max-w-md p-5 rounded-b-none rounded-t-2xl sm:rounded-2xl
      animate-[ios-sheet_0.28s_cubic-bezier(0.32,0.72,0,1)]">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-[16px] font-semibold text-ios-label">{{ title }}</h3>
        <button class="grid place-items-center size-7 rounded-full bg-ios-fill text-ios-secondary hover:text-ios-label active:scale-95 transition"
          @click="emit('close')">✕</button>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
@keyframes ios-sheet {
  from {
    opacity: 0.5;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>