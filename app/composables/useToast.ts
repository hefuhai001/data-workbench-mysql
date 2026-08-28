// 页面居中提示（toast）：用于测试连接、保存/删除连接、保存备注等操作的成败反馈。

export interface ToastItem {
  id: number
  text: string
  type: 'success' | 'error'
}

let seed = 0

export function useToast() {
  const toasts = useState<ToastItem[]>('wb-toasts', () => [])

  function show(text: string, type: ToastItem['type'] = 'success', duration = 2600) {
    const id = ++seed
    toasts.value.push({ id, text, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  function success(text: string) { show(text, 'success') }
  function error(text: string) { show(text, 'error') }

  return { toasts, show, success, error }
}
