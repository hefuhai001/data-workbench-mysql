<script setup lang="ts">
// 新增/编辑连接弹窗表单：填写连接信息保存，成功后刷新连接树
const props = defineProps<{ initial?: Record<string, any> | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { emptyConnectionForm, saveConnection } = useWorkbench()
const { success } = useToast()

const form = ref<Record<string, any>>({})
const isEdit = computed(() => !!props.initial?.id)
const saving = ref(false)
const error = ref('')

watch(() => props.initial, (v) => {
  if (v) form.value = { ...v, port: String(v.port ?? '3306'), password: '' }
  else form.value = emptyConnectionForm()
  error.value = ''
}, { immediate: true })

async function save() {
  if (!form.value.name || !form.value.host || !form.value.port || !form.value.user) {
    error.value = '请填写名称、主机、端口、用户名'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await saveConnection(form.value, props.initial?.id)
    success(props.initial?.id ? '连接已更新' : '连接已保存')
    emit('saved')
    emit('close')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || String(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UiModal :title="isEdit ? '编辑连接' : '新增连接'" @close="emit('close')">
    <div class="space-y-3">
      <UiInput v-model="form.name" label="名称" />
      <div class="grid grid-cols-3 gap-2">
        <div class="col-span-2"><UiInput v-model="form.host" label="主机" placeholder="127.0.0.1" /></div>
        <UiInput v-model="form.port" label="端口" type="number" />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <UiInput v-model="form.user" label="用户名" />
        <UiInput v-model="form.defaultDatabase" label="默认库(可选)" />
      </div>
      <UiInput v-model="form.password" label="密码" type="password" />
      <p class="text-xs text-ios-tertiary">{{ isEdit ? '密码留空则不修改' : '密码将加密保存' }}</p>
      <p v-if="error" class="text-sm text-ios-red">{{ error }}</p>
      <div class="flex justify-end gap-2 pt-2">
        <UiButton @click="emit('close')">取消</UiButton>
        <UiButton variant="primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</UiButton>
      </div>
    </div>
  </UiModal>
</template>
