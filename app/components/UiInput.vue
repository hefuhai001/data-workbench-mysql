<script setup lang="ts">
defineProps<{ label?: string; type?: string; placeholder?: string; modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" class="block text-xs font-medium text-ios-secondary">{{ label }}</label>
    <input
      :type="type || 'text'"
      :placeholder="placeholder"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="ios-input"
    />
  </div>
</template>