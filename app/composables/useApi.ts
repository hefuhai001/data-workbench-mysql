export function useApi() {
  const call = async (url: string, options: Record<string, any> = {}) => {
    try {
      return await $fetch(url, options as any)
    } catch (e: any) {
      if (e?.response?.status === 401) {
        await navigateTo('/unlock')
      }
      throw e
    }
  }
  return { call }
}