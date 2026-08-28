<script setup lang="ts">
// 侧边栏节点备注弹窗：为任意连接/数据库/数据表 编辑或删除备注
const props = defineProps<{ node: WbNode | null }>()
const emit = defineEmits<{ close: [] }>()
const { notes, saveNote } = useWorkbench()
const { success } = useToast()

const text = ref('')
const saving = ref(false)
const error = ref('')
const hasNote = computed(() => !!(props.node && notes.value[props.node.key]))

watch(() => props.node, (n) => {
  if (n) {
    text.value = notes.value[n.key] || ''
    error.value = ''
  }
}, { immediate: true })

async function save() {
  if (!props.node) return
  saving.value = true
  error.value = ''
  try {
    await saveNote(props.node.key, text.value)
    success(text.value.trim() ? '备注已保存' : '备注已删除')
    emit('close')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || String(e)
  } finally {
    saving.value = false
  }
}

function remove() {
  text.value = ''
  save()
}
</script>

<template>
  <UiModal :title="`备注 · ${node?.name || ''}`" @close="emit('close')">
    <textarea
      v-model="text"
      rows="4"
      placeholder="给该连接 / 数据库 / 数据表添加一条备注，留空保存则删除备注"
      class="w-full border border-ios-sep rounded-xl p-3 text-sm text-ios-label bg-ios-fill/50 outline-none focus:border-ios-blue focus:bg-white resize-y transition placeholder:text-ios-quaternary"
    ></textarea>
    <p v-if="error" class="mt-2 text-sm text-ios-red">{{ error }}</p>
    <div class="flex justify-between gap-2 mt-4">
      <UiButton v-if="hasNote" variant="soft" :disabled="saving" @click="remove">删除备注</UiButton>
      <span v-else />
      <div class="flex gap-2">
        <UiButton @click="emit('close')">取消</UiButton>
        <UiButton variant="primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</UiButton>
      </div>
    </div>
  </UiModal>
</template>
