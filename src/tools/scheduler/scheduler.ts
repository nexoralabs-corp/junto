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
