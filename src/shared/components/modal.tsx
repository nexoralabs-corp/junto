import { t } from '../i18n'

export function ConfirmModal({ title, message, confirmLabel, onConfirm }: {
  title: string
  message?: string
  confirmLabel?: string
  onConfirm: () => void
}) {
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML = `
    <div class="modal modal-confirm" role="dialog" aria-modal="true" aria-label="${title}">
      <h2>${title}</h2>
      ${message ? `<p class="modal-desc">${message}</p>` : ''}
      <div class="modal-confirm-actions">
        <button class="secondary" id="confirm-cancel">${t('common.cancel')}</button>
        <button class="contrast" id="confirm-ok">${confirmLabel ?? title}</button>
      </div>
    </div>
  `
  document.body.appendChild(backdrop)
  requestAnimationFrame(() => backdrop.classList.add('open'))
  const close = () => {
    backdrop.classList.remove('open')
    backdrop.addEventListener('transitionend', () => backdrop.remove(), { once: true })
  }
  backdrop.querySelector('#confirm-cancel')!.addEventListener('click', close)
  backdrop.querySelector('#confirm-ok')!.addEventListener('click', () => { close(); onConfirm() })
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close() })
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey) }
  }
  document.addEventListener('keydown', onKey)
}

export function Modal({ icon, title, desc, steps, note }: {
  icon: string
  title: string
  desc: string
  steps: string[]
  note: string
}) {
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
      <button class="modal-close" id="modal-close" aria-label="${t('modal.close')}">×</button>
      <div class="modal-header">
        <div class="modal-icon">${icon}</div>
        <h2>${title}</h2>
      </div>
      <p class="modal-desc">${desc}</p>
      <div class="modal-section-title">${t('modal.how_it_works')}</div>
      <ol class="modal-steps">
        ${steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      <div class="modal-section-title">${t('modal.good_to_know')}</div>
      <div class="modal-note">${note}</div>
    </div>
  `
  document.body.appendChild(backdrop)
  requestAnimationFrame(() => backdrop.classList.add('open'))
  const close = () => {
    backdrop.classList.remove('open')
    backdrop.addEventListener('transitionend', () => backdrop.remove(), { once: true })
  }
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close() })
  backdrop.querySelector('#modal-close')!.addEventListener('click', close)
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey) }
  }
  document.addEventListener('keydown', onKey)
}
