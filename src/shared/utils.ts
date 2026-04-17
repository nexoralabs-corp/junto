export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export function intersect<T>(arrays: T[][]): T[] {
  if (arrays.length === 0) return []
  return arrays.reduce((a, b) => a.filter(x => b.includes(x)))
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Helper for inline styles - used in Scheduler grid cells
export function vars(v: Record<string, string>): preact.JSX.CSSProperties {
  return v as unknown as preact.JSX.CSSProperties
}
