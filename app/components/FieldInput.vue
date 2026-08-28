<script setup lang="ts">
// 按 MySQL 列类型选择对应的输入控件：数值/日期/时间/日期时间/长文本/布尔
const props = defineProps<{ column: any; modelValue?: string; hint?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

type InputKind = 'text' | 'number' | 'date' | 'time' | 'datetime' | 'textarea' | 'bool'

function kind(): InputKind {
  const t = (props.column.dataType || '').trim()
  if (/^tinyint\(1\)$/i.test(t)) return 'bool'
  if (/(longtext|mediumtext|tinytext|text|json|blob|binary)/i.test(t)) return 'textarea'
  if (/^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|real|bit|year)/i.test(t)) return 'number'
  if (/^date$/i.test(t)) return 'date'
  // timestamp/datetime 需先于 time 判断，否则 timestamp 会被 "time" 前缀误判为单时间
  if (/^(datetime|timestamp)/i.test(t)) return 'datetime'
  if (/^time/i.test(t)) return 'time'
  return 'text'
}

function label(): string {
  let s = `${props.column.columnName} (${props.column.dataType})`
  if (props.hint) s += ` · ${props.hint}`
  return s
}

// 原生 input 类型：语义类型 datetime 需映射为 datetime-local（"datetime" 不是合法类型）
const nativeType = computed(() => {
  const k = kind()
  return k === 'datetime' ? 'datetime-local' : k
})

// 原生 datetime-local 需要 "YYYY-MM-DDTHH:mm:ss"：先用共享工具规范化为 MySQL 本地时间，再把空格换成 T
const inputValue = computed(() => {
  const v = props.modelValue ?? ''
  return kind() === 'datetime' ? normalizeDateTime(v).replace(' ', 'T') : v
})

const boolVal = computed({
  get: () => props.modelValue === '1' || (props.modelValue || '').toLowerCase() === 'true',
  set: (v: boolean) => emit('update:modelValue', v ? '1' : '0')
})
</script>

<template>
  <div v-if="kind() === 'bool'" class="space-y-1">
    <label class="flex items-center gap-2 select-none">
      <input v-model="boolVal" type="checkbox" class="size-4 accent-ios-blue" />
      <span class="text-xs font-medium text-ios-secondary">{{ label() }}</span>
    </label>
  </div>
  <div v-else class="space-y-1">
    <label class="block text-xs font-medium text-ios-secondary">{{ label() }}</label>
    <textarea
      v-if="kind() === 'textarea'"
      :value="modelValue"
      rows="3"
      placeholder="多行文本"
      class="ios-input resize-y font-mono"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    ></textarea>
    <input
      v-else
      :type="nativeType"
      :value="inputValue"
      :step="kind() === 'number' ? 'any' : undefined"
      class="ios-input"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
