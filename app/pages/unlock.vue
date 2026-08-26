<script setup lang="ts">
const api = useApi()
const state = ref<'idle' | 'init' | 'unlock'>('idle')
const password = ref('')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  const me = await api.call('/api/me')
  state.value = (me as any).initialized ? 'unlock' : 'init'
})

async function submit() {
  loading.value = true
  error.value = ''
  try {
    if (state.value === 'init' && password.value.length < 6) {
      error.value = '主密码至少 6 位'
      return
    }
    await api.call(state.value === 'init' ? '/api/init-master' : '/api/unlock', {
      method: 'POST',
      body: { password: password.value }
    })
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || '操作失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
      <h1 class="text-xl font-semibold text-center text-slate-800">
        {{ state === 'init' ? '设置主密码' : '解锁 Workbench' }}
      </h1>
      <p class="text-sm text-slate-500 text-center">
        {{ state === 'init' ? '首次使用，请设置主密码。其余密码将用其加密保存。' : '输入主密码以解密已保存的连接。' }}
      </p>
      <input
        v-model="password"
        type="password"
        placeholder="主密码"
        class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        @keyup.enter="submit"
      />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button
        :disabled="loading"
        @click="submit"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg"
      >
        {{ loading ? '请稍候…' : (state === 'init' ? '设置' : '解锁') }}
      </button>
    </div>
  </div>
</template>