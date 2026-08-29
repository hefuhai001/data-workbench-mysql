<script setup lang="ts">
withDefaults(defineProps<{ title?: string; maxW?: string }>(), { maxW: 'max-w-md' })
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <!-- 页面居中弹窗 -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-5"
    @click.self="emit('close')">
    <div class="ios-card w-full p-5 rounded-2xl animate-[ios-pop_0.22s_ease-out]" :class="maxW">
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
@keyframes ios-pop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>