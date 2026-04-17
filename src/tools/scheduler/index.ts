import { t, tArr, toggleLang } from '../../shared/i18n'
import { decodeState, buildShareUrl } from '../../shared/url-state'
import { copyToClipboard } from '../../shared/utils'
import {
  Participant, SchedulerState, HOURS, NUM_DAYS,
  makeSlot, formatHour, slotCounts, getOverlapSlots,
} from './scheduler'
import './scheduler.scss'

let mySlots = new Set<string>()
let myName = ''
let existingParticipants: Participant[] = []
let root: HTMLElement

export function mount(container: HTMLElement): void {
  root = container
  mySlots = new Set()
  myName = ''
  const urlState = decodeState<SchedulerState>()
  existingParticipants = urlState?.participants ?? []
  render()
}

function render(): void {
  const days = tArr('scheduler.days')
  const counts = slotCounts(existingParticipants)
  const overlap = getOverlapSlots(existingParticipants, mySlots)
  const hasOthers = existingParticipants.length > 0

  const gridRows = HOURS.map(h => {
    const cells = Array.from({ length: NUM_DAYS }, (_, d) => {
      const slot = makeSlot(d, h)
      const isMine = mySlots.has(slot)
      const othersCount = counts.get(slot) ?? 0
      const isOverlap = overlap.has(slot)
      const hasOthersHere = othersCount > 0

      let cls = 'sched-cell slot'
      if (isOverlap) cls += ' overlap'
      else if (isMine && hasOthersHere) cls += ' mine others'
      else if (isMine) cls += ' mine'
      else if (hasOthersHere) cls += ' others'

      return `<div class="${cls}" data-slot="${slot}"></div>`
    }).join('')
    return `<div class="sched-cell hour-lbl">${formatHour(h)}</div>${cells}`
  }).join('')

  root.innerHTML = `
    <div class="page">
      <nav class="tool-nav">
        <a href="#" class="back-link">${t('common.back')}</a>
        <span class="tool-title">${t('scheduler.title')}</span>
        <button class="secondary sm" id="lang-btn">${t('nav.lang')}</button>
      </nav>

      <p class="tool-subtitle">${t('scheduler.subtitle')}</p>

      ${hasOthers ? `
        <div class="participants-badge">
          ${t('scheduler.participants')}:
          ${existingParticipants.map(p => `<strong>${p.name}</strong>`).join(', ')}
        </div>
      ` : ''}

      <div class="field-group">
        <label for="name-input">${t('scheduler.your_name')}</label>
        <input id="name-input" type="text"
          placeholder="${t('scheduler.your_name_placeholder')}"
          value="${myName}" autocomplete="off" />
        <span class="field-error" id="name-error" hidden></span>
      </div>

      <div class="grid-scroll">
        <div class="sched-grid" id="sched-grid">
          <div class="sched-cell"></div>
          ${days.map(d => `<div class="sched-cell day-lbl">${d}</div>`).join('')}
          ${gridRows}
        </div>
      </div>

      ${hasOthers ? `
        <div class="overlap-legend">
          <div class="legend-item"><div class="dot mine"></div> ${t('scheduler.your_name')}</div>
          <div class="legend-item"><div class="dot others"></div> ${t('scheduler.participants')}</div>
          <div class="legend-item"><div class="dot overlap"></div> ${t('scheduler.overlap_hint')}</div>
        </div>
      ` : ''}

      <button id="share-btn" class="full-width">${t('scheduler.save_share')}</button>
      <p id="share-feedback" class="feedback success" hidden></p>
    </div>
  `

  root.querySelector<HTMLInputElement>('#name-input')!.addEventListener('input', e => {
    myName = (e.target as HTMLInputElement).value
  })

  root.querySelector('#sched-grid')!.addEventListener('click', e => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-slot]')
    if (!cell) return
    const slot = cell.dataset['slot']!
    if (mySlots.has(slot)) mySlots.delete(slot)
    else mySlots.add(slot)
    render()
  })

  root.querySelector('#share-btn')!.addEventListener('click', async () => {
    const name = root.querySelector<HTMLInputElement>('#name-input')!.value.trim()
    if (!name) {
      const err = root.querySelector<HTMLElement>('#name-error')!
      err.hidden = false
      err.textContent = t('scheduler.no_name')
      return
    }
    const state: SchedulerState = {
      participants: [...existingParticipants, { name, slots: [...mySlots] }],
    }
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
