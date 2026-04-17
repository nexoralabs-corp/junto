import { t } from '../i18n'

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
