import { useState, useRef, useCallback, useEffect } from 'preact/hooks'
import { t, tArr, toggleLang } from '../../shared/i18n'
import { decodeState, buildShareUrl } from '../../shared/url-state'
import { copyToClipboard } from '../../shared/utils'
import {
  Participant, SchedulerState, HOURS, NUM_DAYS,
  makeSlot, formatHour, slotCounts, getExistingOverlap, groupSlots,
  participantColor, colorRgba,
} from './scheduler'
import './scheduler.scss'

// ── helpers ──────────────────────────────────────────────────────────────────

function vars(v: Record<string, string>): preact.JSX.CSSProperties {
  return v as unknown as preact.JSX.CSSProperties
}

function othersFor(participants: Participant[], idx: number): Participant[] {
  return participants.filter((_, i) => i !== idx)
}

function overlapForParticipant(participants: Participant[], idx: number): Set<string> {
  const p = participants[idx]
  if (!p) return new Set()
  const others = othersFor(participants, idx)
  if (others.length === 0) return new Set()
  const mySlots = new Set(p.slots)
  const otherSets = others.map(o => new Set(o.slots))
  const result = new Set<string>()
  for (const slot of mySlots) {
    if (otherSets.every(s => s.has(slot))) result.add(slot)
  }
  return result
}

// ── LinkImportForm ────────────────────────────────────────────────────────────

interface LinkImportFormProps {
  onImport: (name: string, slots: string[]) => void
  onCancel: () => void
}

function LinkImportForm({ onImport, onCancel }: LinkImportFormProps) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => { urlRef.current?.focus() }, [])

  function handleImport() {
    setError('')
    try {
      const raw = url.trim()
      if (!raw) throw new Error()
      const fragment = raw.includes('#') ? raw.split('#')[1] : raw
      const match = fragment?.match(/data=([^&\s]+)/)
      if (!match) throw new Error()
      const b64 = decodeURIComponent(match[1])
      const decoded = JSON.parse(atob(b64)) as SchedulerState
      if (!Array.isArray(decoded.participants) || decoded.participants.length === 0) throw new Error()
      const allSlots = [...new Set(decoded.participants.flatMap(p => p.slots))]
      const fallback = decoded.participants.find(p => p.name.trim())?.name ?? ''
      onImport(name.trim() || fallback, allSlots)
    } catch {
      setError(t('scheduler.import_error'))
    }
  }

  return (
    <div class="link-import-form">
      <div class="link-import-header">
        <span class="link-import-label">{t('scheduler.add_from_link')}</span>
        <span class="link-cancel" role="button" aria-label={t('common.remove')} onClick={onCancel}>×</span>
      </div>
      <input ref={urlRef} type="url" placeholder={t('scheduler.paste_link')} autocomplete="off"
        value={url} onInput={e => setUrl((e.target as HTMLInputElement).value)}
        onKeyDown={e => e.key === 'Enter' && handleImport()} />
      <input type="text" placeholder={t('scheduler.your_name_placeholder')} autocomplete="off"
        value={name} onInput={e => setName((e.target as HTMLInputElement).value)}
        onKeyDown={e => e.key === 'Enter' && handleImport()} />
      <button class="full-width" onClick={handleImport}>{t('scheduler.import')}</button>
      {error && <p class="feedback error">{error}</p>}
    </div>
  )
}

// ── Grid ──────────────────────────────────────────────────────────────────────

interface GridProps {
  participants: Participant[]
  activeTab: 'all' | number
  onMouseDown: (slot: string) => void
  onMouseEnter: (slot: string) => void
}

function Grid({ participants, activeTab, onMouseDown, onMouseEnter }: GridProps) {
  const days = tArr('scheduler.days')

  const dayHeaders = (
    <>
      <div class="sched-cell" />
      {days.map(d => <div class="sched-cell day-lbl" key={d}>{d}</div>)}
    </>
  )

  if (activeTab === 'all') {
    const total = participants.length
    const pSets = participants.map(p => new Set(p.slots))
    return (
      <div class="sched-grid" id="sched-grid" draggable={false}>
        {dayHeaders}
        {HOURS.map(h => (
          <>
            <div class="sched-cell hour-lbl" key={`lbl-${h}`}>{formatHour(h)}</div>
            {Array.from({ length: NUM_DAYS }, (_, d) => {
              const slot = makeSlot(d, h)
              const holders = participants.filter((_, i) => pSets[i].has(slot))
              let cls = 'sched-cell slot'
              let style: preact.JSX.CSSProperties | undefined
              if (holders.length === 0) {
                // empty
              } else if (total > 0 && holders.length === total) {
                cls += ' overlap'
              } else if (holders.length === 1) {
                const ci = participants.indexOf(holders[0])
                const c = participantColor(ci)
                cls += ' solo'
                style = vars({ '--solo-bg': colorRgba(c, 0.18), '--solo-border': colorRgba(c, 0.36) })
              } else {
                const ratio = total > 0 ? (holders.length / total).toFixed(2) : '0'
                cls += ' partial'
                style = vars({ '--overlap-ratio': ratio })
              }
              return <div class={cls} key={slot} data-slot={slot} style={style} />
            })}
          </>
        ))}
      </div>
    )
  }

  const idx = activeTab as number
  const p = participants[idx]
  if (!p) return null
  const mySlots = new Set(p.slots)
  const others = othersFor(participants, idx)
  const counts = slotCounts(others)
  const existingOverlap = getExistingOverlap(others)
  const myOverlap = overlapForParticipant(participants, idx)
  const color = participantColor(idx)

  return (
    <div class="sched-grid" id="sched-grid" draggable={false}
      style={vars({ '--mine-color': color, '--mine-dim': colorRgba(color, 0.15), '--mine-glow': colorRgba(color, 0.28) })}>
      {dayHeaders}
      {HOURS.map(h => (
        <>
          <div class="sched-cell hour-lbl" key={`lbl-${h}`}>{formatHour(h)}</div>
          {Array.from({ length: NUM_DAYS }, (_, d) => {
            const slot = makeSlot(d, h)
            const isMine = mySlots.has(slot)
            const hasOthers = (counts.get(slot) ?? 0) > 0
            let cls = 'sched-cell slot'
            if (myOverlap.has(slot)) cls += ' overlap'
            else if (isMine && hasOthers) cls += ' mine others'
            else if (isMine) cls += ' mine'
            else if (existingOverlap.has(slot)) cls += ' all-others'
            else if (hasOthers) cls += ' others'
            return (
              <div class={cls} key={slot} data-slot={slot}
                onMouseDown={() => onMouseDown(slot)}
                onMouseEnter={() => onMouseEnter(slot)}
              />
            )
          })}
        </>
      ))}
    </div>
  )
}

// ── ResultsPanel ──────────────────────────────────────────────────────────────

function ResultsPanel({ participants, activeTab }: { participants: Participant[], activeTab: 'all' | number }) {
  const days = tArr('scheduler.days')

  if (activeTab === 'all') {
    if (participants.length < 2) return null
    const fullOverlap = getExistingOverlap(participants)
    const ranges = groupSlots(fullOverlap, days)
    return (
      <div class="results-panel">
        <div class="results-section">
          {fullOverlap.size > 0
            ? <>
                <div class="results-label success-label">{t('scheduler.all_free')}</div>
                <div class="results-chips">
                  {ranges.map(r => <span class="result-chip overlap-chip" key={r}>{r}</span>)}
                </div>
              </>
            : <p class="results-empty">{t('scheduler.no_overlap')}</p>
          }
        </div>
      </div>
    )
  }

  const idx = activeTab as number
  const p = participants[idx]
  if (!p || othersFor(participants, idx).length === 0) return null

  const others = othersFor(participants, idx)
  const myOverlap = overlapForParticipant(participants, idx)
  const existingOverlap = getExistingOverlap(others)
  const mySlots = new Set(p.slots)
  const myColor = participantColor(idx)

  return (
    <div class="results-panel">
      {myOverlap.size > 0
        ? <div class="results-section">
            <div class="results-label success-label">{t('scheduler.overlap_with_you')}</div>
            <div class="results-chips">
              {groupSlots(myOverlap, days).map(r => <span class="result-chip overlap-chip" key={r}>{r}</span>)}
            </div>
          </div>
        : mySlots.size > 0
          ? <div class="results-section"><p class="results-empty">{t('scheduler.no_overlap')}</p></div>
          : null
      }
      {existingOverlap.size > 0 && (
        <div class="results-section">
          <div class="results-label">{t('scheduler.existing_overlap')}</div>
          <div class="results-chips">
            {groupSlots(existingOverlap, days).map(r => (
              <span class="result-chip others-chip" key={r}
                style={vars({ background: colorRgba(myColor, 0.07), 'border-color': colorRgba(myColor, 0.20) })}>
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend({ participants, activeTab }: { participants: Participant[], activeTab: 'all' | number }) {
  if (participants.length === 0) return null

  if (activeTab === 'all') {
    return (
      <div class="overlap-legend">
        {participants.map((p, i) => (
          <div class="legend-item" key={i}>
            <div class="dot" style={{ background: participantColor(i) }} />
            {p.name || t('scheduler.unnamed')}
          </div>
        ))}
        {participants.length >= 2 && (
          <div class="legend-item">
            <div class="dot overlap" />
            {t('scheduler.all_free')}
          </div>
        )}
      </div>
    )
  }

  const idx = activeTab as number
  const c = participantColor(idx)
  return (
    <div class="overlap-legend">
      <div class="legend-item"><div class="dot" style={{ background: c }} /> {t('scheduler.your_name')}</div>
      <div class="legend-item"><div class="dot others" /> {t('scheduler.participants')}</div>
      <div class="legend-item"><div class="dot all-others" /> {t('scheduler.existing_overlap')}</div>
      <div class="legend-item"><div class="dot overlap" /> {t('scheduler.all_free')}</div>
    </div>
  )
}

// ── Scheduler (main) ──────────────────────────────────────────────────────────

export default function Scheduler() {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const s = decodeState<SchedulerState>()
    return s?.participants ?? []
  })
  const [activeTab, setActiveTab] = useState<'all' | number>('all')
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [, forceUpdate] = useState(0)

  // Drag refs (no re-render during drag)
  const isDragging = useRef(false)
  const dragAction = useRef<'add' | 'remove'>('add')
  const dragVisited = useRef(new Set<string>())
  const participantsRef = useRef(participants)
  const activeTabRef = useRef(activeTab)

  useEffect(() => { participantsRef.current = participants }, [participants])
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])

  const autoSave = useCallback((ps?: Participant[]) => {
    const list = ps ?? participantsRef.current
    if (list.length === 0) return
    const url = buildShareUrl('scheduler', { participants: list } satisfies SchedulerState)
    window.history.replaceState(null, '', url)
  }, [])

  const applyDragToSlot = useCallback((slot: string) => {
    const tab = activeTabRef.current
    if (tab === 'all' || typeof tab !== 'number') return
    if (dragVisited.current.has(slot)) return
    dragVisited.current.add(slot)
    const ps = participantsRef.current
    const p = ps[tab]
    if (!p) return
    const slotsSet = new Set(p.slots)
    if (dragAction.current === 'add') slotsSet.add(slot)
    else slotsSet.delete(slot)
    p.slots = [...slotsSet]
    // Direct DOM update for performance
    const cell = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
    if (cell) {
      const others = othersFor(ps, tab)
      const existingOverlap = getExistingOverlap(others)
      if (dragAction.current === 'add') {
        cell.classList.add('mine')
        if (existingOverlap.has(slot)) { cell.classList.remove('all-others'); cell.classList.add('overlap') }
      } else {
        cell.classList.remove('mine', 'overlap')
        if (existingOverlap.has(slot)) cell.classList.add('all-others')
      }
    }
  }, [])

  const startDrag = useCallback((slot: string) => {
    const tab = activeTabRef.current
    if (tab === 'all') return
    const p = participantsRef.current[tab as number]
    if (!p) return
    isDragging.current = true
    dragAction.current = new Set(p.slots).has(slot) ? 'remove' : 'add'
    dragVisited.current = new Set()
    applyDragToSlot(slot)
  }, [applyDragToSlot])

  const endDrag = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    setParticipants([...participantsRef.current])
    autoSave()
  }, [autoSave])

  // Touch drag
  function slotFromPoint(x: number, y: number) {
    return document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-slot]')?.dataset['slot'] ?? null
  }

  useEffect(() => {
    const onMouseUp = () => endDrag()
    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [endDrag])

  // Share panel close on outside click
  useEffect(() => {
    if (!shareOpen) return
    const onDoc = (e: MouseEvent) => {
      const wrap = document.querySelector('.share-wrap')
      if (!wrap?.contains(e.target as Node)) setShareOpen(false)
    }
    document.addEventListener('click', onDoc, { capture: true })
    return () => document.removeEventListener('click', onDoc, { capture: true })
  }, [shareOpen])

  async function copied(url: string) {
    autoSave()
    await copyToClipboard(url)
    setShareOpen(false)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2500)
  }

  function handleGridMouseDown(slot: string) {
    startDrag(slot)
  }

  function handleGridMouseEnter(slot: string) {
    if (isDragging.current) applyDragToSlot(slot)
  }

  function handleTouchStart(e: TouchEvent) {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-slot]')
    if (!cell) return
    e.preventDefault()
    startDrag(cell.dataset['slot']!)
    const onMove = (ev: TouchEvent) => {
      ev.preventDefault()
      const t = ev.touches[0]
      const slot = slotFromPoint(t.clientX, t.clientY)
      if (slot) applyDragToSlot(slot)
    }
    const onEnd = () => {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      endDrag()
    }
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }

  function addParticipant() {
    const next = [...participants, { name: '', slots: [] }]
    setParticipants(next)
    setActiveTab(next.length - 1)
    setShowLinkForm(false)
  }

  function removeParticipant(idx: number) {
    const next = participants.filter((_, i) => i !== idx)
    setParticipants(next)
    if (typeof activeTab === 'number' && activeTab >= next.length) setActiveTab('all')
    autoSave(next)
  }

  function handleImport(name: string, slots: string[]) {
    const next = [...participants, { name, slots }]
    setParticipants(next)
    setActiveTab(next.length - 1)
    setShowLinkForm(false)
    autoSave(next)
  }

  function updateName(val: string) {
    if (typeof activeTab !== 'number') return
    const next = participants.map((p, i) => i === activeTab ? { ...p, name: val } : p)
    setParticipants(next)
  }

  const isAll = activeTab === 'all'
  const activeP = typeof activeTab === 'number' ? participants[activeTab] : null

  return (
    <div class="page">
      <nav class="tool-nav">
        <a href="#" class="back-link">{t('common.back')}</a>
        <span class="tool-title">{t('scheduler.title')}</span>
        <button class="secondary sm" onClick={() => { toggleLang(); forceUpdate(n => n + 1) }}>{t('nav.lang')}</button>
      </nav>

      <p class="tool-subtitle">{t('scheduler.subtitle')}</p>

      {/* Tabs */}
      <div class="sched-tabs" role="tablist">
        <button class={`sched-tab${isAll ? ' active' : ''}`} role="tab" data-tab="all"
          style={vars({ '--tab-color': '#334155', '--tab-color-dim': 'rgba(51,65,85,0.10)' })}
          onClick={() => { setActiveTab('all'); setShowLinkForm(false) }}>
          {t('scheduler.tab_all')}
        </button>
        {participants.map((p, i) => {
          const c = participantColor(i)
          return (
            <button key={i} class={`sched-tab${activeTab === i ? ' active' : ''}`} role="tab"
              style={vars({ '--tab-color': c, '--tab-color-dim': colorRgba(c, 0.12) })}
              onClick={() => { setActiveTab(i); setShowLinkForm(false) }}>
              <span class="tab-dot" style={{ background: c }} />
              <span class="tab-name">{p.name || t('scheduler.unnamed')}</span>
              <span class="tab-remove" role="button" aria-label={t('common.remove')}
                onClick={e => { e.stopPropagation(); removeParticipant(i) }}>×</span>
            </button>
          )
        })}
        <button class="sched-tab add-tab" title={t('scheduler.add_person')} onClick={addParticipant}>+</button>
        <button class={`sched-tab link-tab${showLinkForm ? ' active' : ''}`}
          title={t('scheduler.add_from_link')}
          onClick={() => setShowLinkForm(v => !v)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
      </div>

      {showLinkForm && (
        <LinkImportForm
          onImport={handleImport}
          onCancel={() => setShowLinkForm(false)}
        />
      )}

      {!isAll && activeP !== null && (
        <div class="field-group participant-name-field">
          <label for="name-input">{t('scheduler.your_name')}</label>
          <input id="name-input" type="text"
            placeholder={t('scheduler.your_name_placeholder')}
            value={activeP.name} autocomplete="off"
            onInput={e => updateName((e.target as HTMLInputElement).value)}
            onBlur={() => autoSave()} />
        </div>
      )}

      <div class="grid-scroll" onTouchStart={activeTab !== 'all' ? handleTouchStart as unknown as preact.JSX.TouchEventHandler<HTMLDivElement> : undefined}>
        <Grid
          participants={participants}
          activeTab={activeTab}
          onMouseDown={handleGridMouseDown}
          onMouseEnter={handleGridMouseEnter}
        />
      </div>

      <Legend participants={participants} activeTab={activeTab} />
      <ResultsPanel participants={participants} activeTab={activeTab} />

      {/* Share */}
      <div class="share-wrap">
        <button class="full-width secondary" id="share-btn"
          onClick={() => { if (participants.length > 0) setShareOpen(v => !v) }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          {t('scheduler.share')}
        </button>
        {shareOpen && (
          <div class="share-panel">
            <button class="share-option" onClick={() => {
              const url = buildShareUrl('scheduler', { participants } satisfies SchedulerState)
              copied(url)
            }}>
              <span class="share-option-title">{t('scheduler.share_all')}</span>
              <span class="share-option-hint">{participants.filter(p => p.name).map(p => p.name).join(', ') || '—'}</span>
            </button>
            {typeof activeTab === 'number' && participants[activeTab] && (
              <button class="share-option" onClick={() => {
                const p = participants[activeTab as number]
                const url = buildShareUrl('scheduler', { participants: [p] } satisfies SchedulerState)
                copied(url)
              }}>
                <span class="share-option-title">{t('scheduler.share_one')}</span>
                <span class="share-option-hint">{participants[activeTab as number]?.name || t('scheduler.unnamed')}</span>
              </button>
            )}
          </div>
        )}
        {copiedMsg && <p class="feedback success">{t('common.copied')}</p>}
      </div>
    </div>
  )
}
