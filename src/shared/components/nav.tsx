import { t } from '../i18n'

export function ToolNav({ onBack, title, subtitle, children }: {
  onBack?: () => void
  title: string
  subtitle?: string
  children?: preact.ComponentChildren
}) {
  return (
    <>
      <nav class="tool-nav">
        {onBack && <a href="#" class="back-link">{t('common.back')}</a>}
        <span class="tool-title">{title}</span>
        <div class="nav-actions">{children}</div>
      </nav>
      {subtitle && <p class="tool-subtitle">{subtitle}</p>}
    </>
  )
}
