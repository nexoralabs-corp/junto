export type Slot = string // "${day}-${hour}" e.g. "0-9" = Mon 9am

export type Participant = {
  name: string
  slots: Slot[]
}

export type SchedulerState = {
  participants: Participant[]
}

export const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 8..21
export const NUM_DAYS = 7

// Palette: all dark enough for white text (≥4.5:1 contrast)
export const PARTICIPANT_COLORS = [
  '#0D9488', // teal-600
  '#6D28D9', // violet-700
  '#C2410C', // orange-700
  '#1D4ED8', // blue-700
  '#BE185D', // pink-700
  '#15803D', // green-700
  '#92400E', // amber-800
  '#0E7490', // cyan-700
] as const

export function participantColor(idx: number): string {
  return PARTICIPANT_COLORS[idx % PARTICIPANT_COLORS.length]
}

export function colorRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function makeSlot(day: number, hour: number): Slot {
  return `${day}-${hour}`
}

export function formatHour(h: number): string {
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

export function slotCounts(participants: Participant[]): Map<Slot, number> {
  const counts = new Map<Slot, number>()
  for (const p of participants) {
    for (const s of p.slots) {
      counts.set(s, (counts.get(s) ?? 0) + 1)
    }
  }
  return counts
}

export function getOverlapSlots(participants: Participant[], mySlots: Set<Slot>): Set<Slot> {
  if (participants.length === 0 || mySlots.size === 0) return new Set()
  const all = [...participants, { name: '_me', slots: [...mySlots] }]
  const sets = all.map(p => new Set(p.slots))
  const result = new Set<Slot>()
  for (const slot of sets[0]) {
    if (sets.every(s => s.has(slot))) result.add(slot)
  }
  return result
}

// Slots where ALL existing participants overlap (excludes current user)
export function getExistingOverlap(participants: Participant[]): Set<Slot> {
  if (participants.length < 2) return new Set()
  const sets = participants.map(p => new Set(p.slots))
  const result = new Set<Slot>()
  for (const slot of sets[0]) {
    if (sets.every(s => s.has(slot))) result.add(slot)
  }
  return result
}

// Group slots into human-readable ranges e.g. "Mon · 9am–11am"
export function groupSlots(slots: Set<Slot> | Slot[], dayNames: string[]): string[] {
  const arr = [...slots].map(s => {
    const [d, h] = s.split('-').map(Number)
    return { day: d, hour: h, slot: s }
  })
  arr.sort((a, b) => a.day - b.day || a.hour - b.hour)

  const ranges: string[] = []
  let i = 0
  while (i < arr.length) {
    const start = arr[i]
    let end = arr[i]
    while (
      i + 1 < arr.length &&
      arr[i + 1].day === start.day &&
      arr[i + 1].hour === end.hour + 1
    ) {
      i++
      end = arr[i]
    }
    const day = dayNames[start.day] ?? `Day ${start.day}`
    const from = formatHour(start.hour)
    const to = formatHour(end.hour + 1)
    ranges.push(start.hour === end.hour ? `${day} · ${from}` : `${day} · ${from}–${to}`)
    i++
  }
  return ranges
}
