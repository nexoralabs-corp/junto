import { useState } from 'preact/hooks'

export function Accordion({ title, children, defaultOpen = false, open: controlledOpen, onToggle }: {
  title: string
  children: preact.ComponentChildren
  defaultOpen?: boolean
  open?: boolean
  onToggle?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = controlledOpen !== undefined ? controlledOpen : open

  function handleToggle() {
    if (onToggle) onToggle(!isOpen)
    else setOpen(o => !o)
  }

  return (
    <div class={`accordion${isOpen ? ' accordion--open' : ''}`}>
      <button class="accordion-trigger" onClick={handleToggle} aria-expanded={isOpen}>
        <span>{title}</span>
        <svg class="accordion-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>
      {isOpen && <div class="accordion-body">{children}</div>}
    </div>
  )
}

export function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

export function Chip({ label, onRemove, class: extraClass }: { label: string; onRemove?: () => void; class?: string }) {
  return (
    <span class={`chip${extraClass ? ' ' + extraClass : ''}`}>
      {label}
      {onRemove && <button class="chip-remove" onClick={onRemove}>×</button>}
    </span>
  )
}

export function Section({ title, children }: { title: string; children?: preact.ComponentChildren }) {
  return (
    <section class="section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

export function Feedback({ text, type }: { text: string; type?: 'success' | 'error' }) {
  return <p class={`feedback${type ? ' ' + type : ''}`}>{text}</p>
}
