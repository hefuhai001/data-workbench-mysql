<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'ghost' | 'danger' }>()
</script>

<template>
  <button :class="[
    'px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50',
    variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700'
    : variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
  ]">
    <slot />
  </button>
</template>