<script setup lang="ts">
defineProps<{ title?: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold">{{ title }}</h3>
        <button class="text-slate-400 hover:text-slate-700" @click="emit('close')">✕</button>
      </div>
      <slot />
    </div>
  </div>
</template>