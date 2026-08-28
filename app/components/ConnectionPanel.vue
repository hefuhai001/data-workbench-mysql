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
  <div class="ios-card">
    <div class="flex justify-between items-center px-4 h-12 border-b border-ios-sep">
      <h2 class="text-[15px] font-semibold text-ios-label">连接</h2>
      <UiButton variant="soft" size="sm" @click="openNew">＋ 新增</UiButton>
    </div>

    <p v-if="!list.length" class="px-4 py-8 text-sm text-ios-tertiary text-center">暂无连接，点击「＋ 新增」添加。</p>

    <div v-else class="divide-y divide-ios-sep">
      <div v-for="c in list" :key="c.id" class="flex items-center gap-2 px-4 py-2.5 pl-4"
        :class="currentId === c.id ? 'bg-ios-highlight' : ''">
        <button class="flex-1 min-w-0 text-left flex items-center gap-3 py-0.5" @click="switchConn(c)">
          <!-- 状态圆点 -->
          <span class="shrink-0 size-2.5 rounded-full"
            :class="currentId === c.id ? 'bg-ios-green' : 'bg-ios-quaternary'"></span>
          <span class="min-w-0">
            <span class="block truncate text-[15px] font-medium text-ios-label">{{ c.name }}</span>
            <span class="block text-xs text-ios-secondary truncate">{{ c.host }}:{{ c.port }} · {{ c.user }}</span>
          </span>
        </button>
        <div class="flex gap-1 shrink-0 text-[13px]">
          <button class="ios-btn ios-btn-plain !px-2.5 !py-1" @click="testConn(c)">测试</button>
          <button class="ios-btn ios-btn-plain !px-2.5 !py-1" @click="openEdit(c)">编辑</button>
          <button class="ios-btn ios-btn-plain !px-2.5 !py-1 !text-ios-red" @click="remove(c)">删除</button>
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
        <p class="text-xs text-ios-tertiary">{{ isEdit ? '密码留空则不修改' : '密码将加密保存' }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <UiButton @click="showEdit = false">取消</UiButton>
          <UiButton variant="primary" @click="save">保存</UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>