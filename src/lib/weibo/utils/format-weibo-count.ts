export function formatWeiboCount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (value <= 9999) return String(value)
  return `${(value / 10000).toFixed(1)}万`
}
