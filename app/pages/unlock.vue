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
  <div class="min-h-screen flex items-center justify-center bg-ios-bg p-4">
    <div class="w-full max-w-sm ios-card p-7 space-y-4">
      <div class="flex flex-col items-center gap-3">
        <div class="grid place-items-center size-14 rounded-[16px] bg-ios-blue text-white text-xl shadow-lg shadow-ios-blue/25">DB</div>
        <h1 class="text-lg font-semibold text-center text-ios-label">
          {{ state === 'init' ? '设置主密码' : '解锁 Workbench' }}
        </h1>
      </div>
      <p class="text-sm text-ios-secondary text-center leading-relaxed">
        {{ state === 'init' ? '首次使用，请设置主密码。其余密码将用其加密保存。' : '输入主密码以解密已保存的连接。' }}
      </p>
      <input
        v-model="password"
        type="password"
        placeholder="主密码"
        class="ios-input"
        @keyup.enter="submit"
      />
      <p v-if="error" class="text-sm text-ios-red text-center">{{ error }}</p>
      <button
        :disabled="loading"
        @click="submit"
        class="w-full ios-btn ios-btn-primary !py-2.5 text-[15px] disabled:opacity-50"
      >
        {{ loading ? '请稍候…' : (state === 'init' ? '设置' : '解锁') }}
      </button>
    </div>
  </div>
</template>