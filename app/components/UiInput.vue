<script setup lang="ts">
defineProps<{ label?: string; type?: string; placeholder?: string; modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" class="text-sm text-slate-600">{{ label }}</label>
    <input
      :type="type || 'text'"
      :placeholder="placeholder"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</template>