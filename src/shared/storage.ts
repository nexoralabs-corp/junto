export function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function load<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function clear(key: string): void {
  localStorage.removeItem(key)
}
