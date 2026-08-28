// PWA 安装：注册 Service Worker，捕获 beforeinstallprompt，提供安装按钮状态与触发安装
// 模块级单例：首次调用即绑定全局事件，AppHeader / 插件可共用同一状态

let bound = false
const deferred = ref<any>(null)
const canInstall = ref(false)
const installed = ref(false)

function bind() {
  if (bound || !process.client) return
  bound = true

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }

  const onPrompt = (e: any) => {
    // 阻止浏览器默认的自动安装条，改由我们的按钮触发
    e.preventDefault()
    deferred.value = e
    canInstall.value = true
  }
  const onInstalled = () => {
    deferred.value = null
    canInstall.value = false
    installed.value = true
  }
  window.addEventListener('beforeinstallprompt', onPrompt)
  window.addEventListener('appinstalled', onInstalled)
}

export function usePwaInstall() {
  bind()

  async function install(): Promise<boolean> {
    const ev = deferred.value
    if (!ev) return false
    ev.prompt()
    try {
      const choice = await ev.userChoice
      return choice?.outcome === 'accepted'
    } catch {
      return false
    } finally {
      deferred.value = null
      canInstall.value = false
    }
  }

  return { canInstall, installed, install }
}
