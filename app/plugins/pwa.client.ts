// 客户端插件：应用启动最早阶段就绑定 PWA 安装事件并注册 Service Worker
export default defineNuxtPlugin(() => {
  usePwaInstall()
})
