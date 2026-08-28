<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'ghost' | 'danger' | 'soft'; size?: 'sm' | 'md' }>(), {
  variant: 'ghost',
  size: 'md'
})
</script>

<template>
  <button :class="[
    'ios-btn',
    size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm',
    variant === 'primary' ? 'ios-btn-primary'
    : variant === 'danger' ? 'ios-btn-danger'
    : variant === 'soft' ? 'ios-btn-soft'
    : 'ios-btn-soft'
  ]">
    <slot />
  </button>
</template>