<script setup lang="ts">
// 广告内容集中配置，替换真实合作方只需修改此对象
const ad = {
  enabled: true,
  label: '合作',
  name: '某某云',
  text: '「某某云」MySQL 高可用托管，新用户 1 折试用',
  link: 'https://example.com'
}

// 关闭状态持久化，本次设备不再显示
const DISMISS_KEY = 'workbench-ad-banner-dismissed'
const dismissed = ref(false)

function dismiss() {
  dismissed.value = true
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch { /* SSR 或隐私模式下忽略 */ }
}

if (process.client && localStorage.getItem(DISMISS_KEY)) {
  dismissed.value = true
}

const show = computed(() => ad.enabled && !dismissed.value)
</script>

<template>
  <div v-if="show" class="px-4 pt-3">
    <div class="mx-auto max-w-6xl flex items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-100 px-4 py-2.5">
      <span class="shrink-0 rounded-md bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white">{{ ad.label }}</span>
      <a
        :href="ad.link"
        target="_blank"
        rel="noopener"
        class="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-blue-900 hover:text-blue-700"
      >
        <span class="truncate">{{ ad.text }}</span>
        <span class="shrink-0 text-blue-600">了解详情 →</span>
      </a>
      <button
        class="shrink-0 rounded-md px-1 text-slate-400 hover:text-slate-600"
        title="关闭"
        @click="dismiss"
      >✕</button>
    </div>
  </div>
</template>
