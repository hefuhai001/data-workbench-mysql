export function useApi() {
  const call = async (url: string, options: RequestInit = {}) => {
    try {
      return await $fetch(url, options)
    } catch (e: any) {
      if (e?.response?.status === 401) {
        await navigateTo('/unlock')
      }
      throw e
    }
  }
  return { call }
}