interface BaseButtonProps {
  onClick?: () => void
  class?: string
  disabled?: boolean
  title?: string
  children?: preact.ComponentChildren
}

export function PrimaryButton({ onClick, class: extraClass, disabled, title, children }: BaseButtonProps) {
  return (
    <button class={`primary${extraClass ? ' ' + extraClass : ''}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}

export function SecondaryButton({ onClick, class: extraClass, ghost, sm, ghostText, children }: BaseButtonProps & { ghost?: boolean; sm?: boolean; ghostText?: string }) {
  const cls = `secondary${ghost ? ' ghost' : ''}${sm ? ' sm' : ''}${extraClass ? ' ' + extraClass : ''}`
  return <button class={cls} onClick={onClick} title={ghostText}>{children ?? (ghost && ghostText)}</button>
}

export function InfoButton() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="7.5" r="6.75" stroke="currentColor" stroke-width="1.5"/>
      <rect x="7" y="6.5" width="1" height="4.5" rx="0.5" fill="currentColor"/>
      <rect x="6.75" y="4" width="1.5" height="1.5" rx="0.75" fill="currentColor"/>
    </svg>
  )
}
