// 日期时间工具：判断列类型 + 将数据库返回值规范化为 MySQL 可接受的本地时间格式
// Nuxt 会自动导入本文件导出的函数（app/utils/）

export function isDateTimeType(dataType: string): boolean {
  return /^(datetime|timestamp)/i.test((dataType || '').trim())
}

// 将 ISO(带 Z/毫秒) 或 "空格分隔" 的值统一解析并转为本地时间 "YYYY-MM-DD HH:mm:ss"
// 带时区（Z / ±HH:mm）按绝对时间转本地；无时区按本地时间；无法解析则原样返回
export function normalizeDateTime(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return v
  const y = Number(m[1]), mo = Number(m[2]), dd = Number(m[3])
  const hh = Number(m[4]), mi = Number(m[5]), ss = Number(m[6] || 0)
  let d: Date
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(v)) {
    d = new Date(v)
  } else {
    d = new Date(y, mo - 1, dd, hh, mi, ss)
  }
  if (isNaN(d.getTime())) return v
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
