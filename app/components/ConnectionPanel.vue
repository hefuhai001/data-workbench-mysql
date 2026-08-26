<script setup lang="ts">
const api = useApi()
const list = ref<any[]>([])
const showEdit = ref(false)
const isEdit = ref(false)
const editing = ref<Record<string, any>>({})
const currentId = ref<string | null>(null)
const emit = defineEmits<{ changed: [] }>()

async function load() {
  list.value = (await api.call('/api/connections')) as any[]
}

async function switchConn(c: any) {
  if (currentId.value === c.id) return
  await api.call(`/api/connections/${c.id}/switch`, { method: 'POST' })
  currentId.value = c.id
  emit('changed')
}

function openNew() {
  isEdit.value = false
  editing.value = { name: '', host: '', port: '3306', user: '', password: '', defaultDatabase: '' }
  showEdit.value = true
}

function openEdit(c: any) {
  isEdit.value = true
  editing.value = { ...c, port: String(c.port), password: '' }
  showEdit.value = true
}

async function save() {
  const body: Record<string, any> = {
    name: editing.value.name, host: editing.value.host,
    port: Number(editing.value.port), user: editing.value.user,
    defaultDatabase: editing.value.defaultDatabase || '', password: editing.value.password || ''
  }
  if (isEdit.value) {
    await api.call(`/api/connections/${editing.value.id}`, { method: 'PUT', body })
  } else {
    await api.call('/api/connections', { method: 'POST', body })
  }
  showEdit.value = false
  await load()
}

async function testConn(c: any) {
  const res = (await api.call(`/api/connections/${c.id}/test`, { method: 'POST' })) as any
  alert(res?.message || '测试完成')
}

async function remove(c: any) {
  if (!confirm(`删除连接「${c.name}」？`)) return
  await api.call(`/api/connections/${c.id}`, { method: 'DELETE' })
  await load()
  if (currentId.value === c.id) currentId.value = null
}

onMounted(load)
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
    <div class="flex justify-between items-center">
      <h2 class="font-semibold text-slate-700">连接</h2>
      <UiButton variant="primary" @click="openNew">＋ 新增</UiButton>
    </div>
    <p v-if="!list.length" class="text-sm text-slate-400">暂无连接，点击"＋ 新增"添加。</p>
    <div v-for="c in list" :key="c.id" class="border rounded-lg px-3 py-2"
      :class="currentId === c.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'">
      <div class="flex items-center justify-between">
        <button class="flex-1 text-left" @click="switchConn(c)">
          <div class="font-medium text-slate-800">{{ c.name }}</div>
          <div class="text-xs text-slate-500">{{ c.host }}:{{ c.port }} · {{ c.user }}</div>
        </button>
        <div class="flex gap-2 text-xs">
          <button class="text-slate-400 hover:text-blue-600" @click="testConn(c)">测试</button>
          <button class="text-slate-400 hover:text-blue-600" @click="openEdit(c)">编辑</button>
          <button class="text-slate-400 hover:text-red-600" @click="remove(c)">删</button>
        </div>
      </div>
    </div>

    <UiModal v-if="showEdit" :title="isEdit ? '编辑连接' : '新增连接'" @close="showEdit = false">
      <div class="space-y-3">
        <UiInput v-model="editing.name" label="名称" />
        <div class="grid grid-cols-3 gap-2">
          <div class="col-span-2"><UiInput v-model="editing.host" label="主机" placeholder="127.0.0.1" /></div>
          <UiInput v-model="editing.port" label="端口" type="number" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <UiInput v-model="editing.user" label="用户名" />
          <UiInput v-model="editing.defaultDatabase" label="默认库(可选)" />
        </div>
        <UiInput v-model="editing.password" label="密码" type="password" />
        <p class="text-xs text-slate-400">{{ isEdit ? '密码留空则不修改' : '密码将加密保存' }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <UiButton @click="showEdit = false">取消</UiButton>
          <UiButton variant="primary" @click="save">保存</UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>