import { useState, useRef, useEffect } from 'preact/hooks'
import { t } from '../../shared/i18n'
import { SchedulerState } from './scheduler'

export function SlotCell({ slot, className, style, onMouseDown, onMouseEnter }: {
  slot: string
  className: string
  style?: preact.JSX.CSSProperties
  onMouseDown?: () => void
  onMouseEnter?: () => void
}) {
  return (
    <div
      class={className}
      data-slot={slot}
      style={style}
      onMouseDown={() => onMouseDown?.()}
      onMouseEnter={() => onMouseEnter?.()}
    />
  )
}

export function ResultChip({ label, type }: { label: string; type?: 'overlap' | 'others' }) {
  const cls = `result-chip${type === 'overlap' ? ' overlap-chip' : ''}${type === 'others' ? ' others-chip' : ''}`
  return <span class={cls}>{label}</span>
}

export function LegendItem({ color, isOverlap, isOthers, isAllOthers, label }: {
  color?: string
  isOverlap?: boolean
  isOthers?: boolean
  isAllOthers?: boolean
  label: string
}) {
  const cls = `legend-item${isOverlap ? ' overlap' : ''}${isOthers ? ' others' : ''}${isAllOthers ? ' all-others' : ''}`
  return (
    <div class={cls}>
      {color && <div class="dot" style={{ background: color }} />}
      {label}
    </div>
  )
}

export function LinkImportForm({ onImport, onCancel }: {
  onImport: (name: string, slots: string[]) => void
  onCancel: () => void
}) {
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
