import { t, tArr, toggleLang } from '../../shared/i18n'
import { decodeState, buildShareUrl } from '../../shared/url-state'
import { copyToClipboard } from '../../shared/utils'
import {
  Participant, SchedulerState, HOURS, NUM_DAYS,
  makeSlot, formatHour, slotCounts, getExistingOverlap, groupSlots,
} from './scheduler'
import './scheduler.scss'

let participants: Participant[] = []
let activeTab: 'all' | number = 'all'
let showLinkForm = false
let root: HTMLElement

// Drag state
let isDragging = false
let dragAction: 'add' | 'remove' = 'add'
let dragVisited = new Set<string>()

export function mount(container: HTMLElement): void {
  root = container
  isDragging = false
  showLinkForm = false
  const urlState = decodeState<SchedulerState>()
  participants = urlState?.participants ?? []
  activeTab = 'all'
  render()
}

function currentParticipant(): Participant | null {
  return typeof activeTab === 'number' ? (participants[activeTab] ?? null) : null
}

function othersFor(idx: number): Participant[] {
  return participants.filter((_, i) => i !== idx)
}

function overlapForParticipant(idx: number): Set<string> {
  const p = participants[idx]
  if (!p) return new Set()
  const others = othersFor(idx)
  if (others.length === 0) return new Set()
  const mySlots = new Set(p.slots)
  const otherSets = others.map(o => new Set(o.slots))
  const result = new Set<string>()
  for (const slot of mySlots) {
    if (otherSets.every(s => s.has(slot))) result.add(slot)
  }
  return result
}

function startDrag(slot: string): void {
  if (activeTab === 'all') return
  const p = currentParticipant()
  if (!p) return
  isDragging = true
  dragAction = new Set(p.slots).has(slot) ? 'remove' : 'add'
  dragVisited = new Set()
  applyDragToSlot(slot)
}

function applyDragToSlot(slot: string): void {
  if (activeTab === 'all' || typeof activeTab !== 'number') return
  if (dragVisited.has(slot)) return
  dragVisited.add(slot)

  const p = participants[activeTab]
  if (!p) return
  const slotsSet = new Set(p.slots)
  if (dragAction === 'add') slotsSet.add(slot)
  else slotsSet.delete(slot)
  p.slots = [...slotsSet]

  const cell = root.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
  if (!cell) return
  const existingOverlap = getExistingOverlap(othersFor(activeTab))

  if (dragAction === 'add') {
    cell.classList.add('mine')
    if (existingOverlap.has(slot)) {
      cell.classList.remove('all-others')
      cell.classList.add('overlap')
    }
  } else {
    cell.classList.remove('mine', 'overlap')
    if (existingOverlap.has(slot)) cell.classList.add('all-others')
  }
}

function endDrag(): void {
  if (!isDragging) return
  isDragging = false
  render()
}

function slotFromPoint(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)
  const cell = el?.closest<HTMLElement>('[data-slot]')
  return cell?.dataset['slot'] ?? null
}

function buildGrid(): string {
  const days = tArr('scheduler.days')

  if (activeTab === 'all') {
    const counts = slotCounts(participants)
    const total = participants.length
    const rows = HOURS.map(h => {
      const cells = Array.from({ length: NUM_DAYS }, (_, d) => {
        const slot = makeSlot(d, h)
        const count = counts.get(slot) ?? 0
        if (count === 0) return `<div class="sched-cell slot" data-slot="${slot}"></div>`
        if (total > 0 && count === total) return `<div class="sched-cell slot overlap" data-slot="${slot}"></div>`
        const ratio = total > 0 ? (count / total).toFixed(2) : '0'
        return `<div class="sched-cell slot partial" data-slot="${slot}" style="--overlap-ratio:${ratio}"></div>`
      }).join('')
      return `<div class="sched-cell hour-lbl">${formatHour(h)}</div>${cells}`
    }).join('')
    return `<div class="sched-grid" id="sched-grid" draggable="false">
      <div class="sched-cell"></div>
      ${days.map(d => `<div class="sched-cell day-lbl">${d}</div>`).join('')}
      ${rows}
    </div>`
  }

  const idx = activeTab as number
  const p = participants[idx]
  if (!p) return ''
  const mySlots = new Set(p.slots)
  const others = othersFor(idx)
  const counts = slotCounts(others)
  const existingOverlap = getExistingOverlap(others)
  const myOverlap = overlapForParticipant(idx)

  const rows = HOURS.map(h => {
    const cells = Array.from({ length: NUM_DAYS }, (_, d) => {
      const slot = makeSlot(d, h)
      const isMine = mySlots.has(slot)
      const hasOthersHere = (counts.get(slot) ?? 0) > 0
      let cls = 'sched-cell slot'
      if (myOverlap.has(slot)) cls += ' overlap'
      else if (isMine && hasOthersHere) cls += ' mine others'
      else if (isMine) cls += ' mine'
      else if (existingOverlap.has(slot)) cls += ' all-others'
      else if (hasOthersHere) cls += ' others'
      return `<div class="${cls}" data-slot="${slot}"></div>`
    }).join('')
    return `<div class="sched-cell hour-lbl">${formatHour(h)}</div>${cells}`
  }).join('')

  return `<div class="sched-grid" id="sched-grid" draggable="false">
    <div class="sched-cell"></div>
    ${days.map(d => `<div class="sched-cell day-lbl">${d}</div>`).join('')}
    ${rows}
  </div>`
}

function buildResultsPanel(): string {
  const days = tArr('scheduler.days')

  if (activeTab === 'all') {
    if (participants.length < 2) return ''
    const fullOverlap = getExistingOverlap(participants)
    const ranges = groupSlots(fullOverlap, days)
    return `<div class="results-panel"><div class="results-section">
      ${fullOverlap.size > 0
        ? `<div class="results-label success-label">${t('scheduler.all_free')}</div>
           <div class="results-chips">${ranges.map(r => `<span class="result-chip overlap-chip">${r}</span>`).join('')}</div>`
        : `<p class="results-empty">${t('scheduler.no_overlap')}</p>`}
    </div></div>`
  }

  const idx = activeTab as number
  const p = participants[idx]
  if (!p || othersFor(idx).length === 0) return ''

  const others = othersFor(idx)
  const myOverlap = overlapForParticipant(idx)
  const existingOverlap = getExistingOverlap(others)
  const mySlots = new Set(p.slots)

  return `<div class="results-panel">
    ${myOverlap.size > 0 ? `
      <div class="results-section">
        <div class="results-label success-label">${t('scheduler.overlap_with_you')}</div>
        <div class="results-chips">${groupSlots(myOverlap, days).map(r => `<span class="result-chip overlap-chip">${r}</span>`).join('')}</div>
      </div>` : mySlots.size > 0 ? `
      <div class="results-section"><p class="results-empty">${t('scheduler.no_overlap')}</p></div>` : ''}
    ${existingOverlap.size > 0 ? `
      <div class="results-section">
        <div class="results-label">${t('scheduler.existing_overlap')}</div>
        <div class="results-chips">${groupSlots(existingOverlap, days).map(r => `<span class="result-chip others-chip">${r}</span>`).join('')}</div>
      </div>` : ''}
  </div>`
}

function render(): void {
  const isAll = activeTab === 'all'
  const activeP = currentParticipant()

  const tabs = `<div class="sched-tabs" role="tablist">
    <button class="sched-tab${isAll ? ' active' : ''}" data-tab="all" role="tab">${t('scheduler.tab_all')}</button>
    ${participants.map((p, i) => `
      <button class="sched-tab${activeTab === i ? ' active' : ''}" data-tab="${i}" role="tab">
        <span class="tab-name">${p.name || t('scheduler.unnamed')}</span>
        <span class="tab-remove" data-remove="${i}" title="${t('common.remove')}" role="button" aria-label="${t('common.remove')}">×</span>
      </button>`).join('')}
    <button class="sched-tab add-tab" id="add-person-btn" title="${t('scheduler.add_person')}">+</button>
    <button class="sched-tab link-tab${showLinkForm ? ' active' : ''}" id="add-link-btn" title="${t('scheduler.add_from_link')}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    </button>
  </div>`

  const linkForm = showLinkForm ? `
    <div class="link-import-form">
      <input id="link-input" type="url" placeholder="${t('scheduler.paste_link')}" autocomplete="off" />
      <button class="secondary sm" id="link-import-btn">${t('scheduler.import')}</button>
      <span class="link-cancel" id="link-cancel-btn">×</span>
      <p id="link-error" class="feedback error" hidden></p>
    </div>` : ''

  const nameField = !isAll && activeP !== null ? `
    <div class="field-group participant-name-field">
      <label for="name-input">${t('scheduler.your_name')}</label>
      <input id="name-input" type="text"
        placeholder="${t('scheduler.your_name_placeholder')}"
        value="${activeP.name}" autocomplete="off" />
    </div>` : ''

  const legend = participants.length > 0 ? (isAll
    ? `<div class="overlap-legend">
        <div class="legend-item"><div class="dot partial-legend"></div> ${t('scheduler.partial_overlap')}</div>
        <div class="legend-item"><div class="dot overlap"></div> ${t('scheduler.all_free')}</div>
      </div>`
    : `<div class="overlap-legend">
        <div class="legend-item"><div class="dot mine"></div> ${t('scheduler.your_name')}</div>
        <div class="legend-item"><div class="dot others"></div> ${t('scheduler.participants')}</div>
        <div class="legend-item"><div class="dot all-others"></div> ${t('scheduler.existing_overlap')}</div>
        <div class="legend-item"><div class="dot overlap"></div> ${t('scheduler.all_free')}</div>
      </div>`) : ''

  root.innerHTML = `
    <div class="page">
      <nav class="tool-nav">
        <a href="#" class="back-link">${t('common.back')}</a>
        <span class="tool-title">${t('scheduler.title')}</span>
        <button class="secondary sm" id="lang-btn">${t('nav.lang')}</button>
      </nav>

      <p class="tool-subtitle">${t('scheduler.subtitle')}</p>

      ${tabs}
      ${linkForm}
      ${nameField}

      <div class="grid-scroll">
        ${buildGrid()}
      </div>

      ${legend}
      ${buildResultsPanel()}

      <button id="share-btn" class="full-width">${t('scheduler.save_share')}</button>
      <p id="share-feedback" class="feedback success" hidden></p>
    </div>
  `

  // ── Name input ──────────────────────────────────────────────────────────────
  root.querySelector<HTMLInputElement>('#name-input')?.addEventListener('input', e => {
    const val = (e.target as HTMLInputElement).value
    if (typeof activeTab === 'number' && participants[activeTab]) {
      participants[activeTab].name = val
      const label = root.querySelector<HTMLElement>(`[data-tab="${activeTab}"] .tab-name`)
      if (label) label.textContent = val || t('scheduler.unnamed')
    }
  })

  // ── Tabs ────────────────────────────────────────────────────────────────────
  root.querySelectorAll<HTMLElement>('[data-tab]').forEach(btn => {
    btn.addEventListener('click', e => {
      if ((e.target as HTMLElement).closest('[data-remove]')) return
      const tab = btn.dataset['tab']!
      activeTab = tab === 'all' ? 'all' : parseInt(tab)
      showLinkForm = false
      render()
    })
  })

  root.querySelectorAll<HTMLElement>('[data-remove]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation()
      const idx = parseInt((el as HTMLElement).dataset['remove']!)
      participants.splice(idx, 1)
      if (typeof activeTab === 'number' && activeTab >= participants.length) activeTab = 'all'
      render()
    })
  })

  // ── Add person ──────────────────────────────────────────────────────────────
  root.querySelector('#add-person-btn')?.addEventListener('click', () => {
    participants.push({ name: '', slots: [] })
    activeTab = participants.length - 1
    showLinkForm = false
    render()
    root.querySelector<HTMLInputElement>('#name-input')?.focus()
  })

  // ── Link form ───────────────────────────────────────────────────────────────
  root.querySelector('#add-link-btn')?.addEventListener('click', () => {
    showLinkForm = !showLinkForm
    render()
    if (showLinkForm) root.querySelector<HTMLInputElement>('#link-input')?.focus()
  })

  root.querySelector('#link-import-btn')?.addEventListener('click', () => {
    const input = root.querySelector<HTMLInputElement>('#link-input')!
    const err = root.querySelector<HTMLElement>('#link-error')!
    try {
      const raw = input.value.trim()
      const hash = raw.includes('#') ? raw.split('#')[1] : raw
      const match = hash.match(/data=([^&]+)/)
      if (!match) throw new Error()
      const decoded = JSON.parse(atob(match[1])) as SchedulerState
      if (!Array.isArray(decoded.participants) || decoded.participants.length === 0) throw new Error()
      const added = decoded.participants.filter(p => !participants.some(ep => ep.name === p.name))
      if (added.length === 0) throw new Error()
      participants.push(...added)
      showLinkForm = false
      activeTab = 'all'
      render()
    } catch {
      err.hidden = false
      err.textContent = t('scheduler.import_error')
    }
  })

  root.querySelector('#link-cancel-btn')?.addEventListener('click', () => {
    showLinkForm = false
    render()
  })

  // ── Grid drag (mouse + touch) ───────────────────────────────────────────────
  const grid = root.querySelector<HTMLElement>('#sched-grid')
  if (grid && activeTab !== 'all') {
    grid.addEventListener('mousedown', e => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-slot]')
      if (!cell) return
      e.preventDefault()
      startDrag(cell.dataset['slot']!)
      const onMove = (ev: MouseEvent): void => {
        const slot = slotFromPoint(ev.clientX, ev.clientY)
        if (slot) applyDragToSlot(slot)
      }
      const onUp = (): void => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        endDrag()
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })

    grid.addEventListener('touchstart', e => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-slot]')
      if (!cell) return
      e.preventDefault()
      startDrag(cell.dataset['slot']!)
      const onMove = (ev: TouchEvent): void => {
        ev.preventDefault()
        const touch = ev.touches[0]
        const slot = slotFromPoint(touch.clientX, touch.clientY)
        if (slot) applyDragToSlot(slot)
      }
      const onEnd = (): void => {
        document.removeEventListener('touchmove', onMove)
        document.removeEventListener('touchend', onEnd)
        endDrag()
      }
      document.addEventListener('touchmove', onMove, { passive: false })
      document.addEventListener('touchend', onEnd)
    }, { passive: false })
  }

  // ── Share ───────────────────────────────────────────────────────────────────
  root.querySelector('#share-btn')!.addEventListener('click', async () => {
    const clean = participants.filter(p => p.name.trim())
    if (clean.length === 0) return
    const state: SchedulerState = { participants: clean }
    const url = buildShareUrl('scheduler', state)
    window.history.replaceState(null, '', url)
    await copyToClipboard(url)
    const fb = root.querySelector<HTMLElement>('#share-feedback')!
    fb.hidden = false
    fb.textContent = t('common.copied')
    setTimeout(() => { fb.hidden = true }, 2500)
  })

  root.querySelector('#lang-btn')!.addEventListener('click', () => {
    toggleLang()
    render()
  })
}
