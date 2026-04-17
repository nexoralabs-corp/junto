export function encodeState<T>(state: T): string {
  return btoa(JSON.stringify(state))
}

export function decodeState<T>(): T | null {
  const hash = window.location.hash
  const match = hash.match(/data=([^&]+)/)
  if (!match) return null
  try {
    return JSON.parse(atob(match[1])) as T
  } catch {
    return null
  }
}

export function buildShareUrl(tool: string, state: unknown): string {
  return `${window.location.origin}${window.location.pathname}#${tool}&data=${encodeState(state)}`
}
