import '@fontsource-variable/plus-jakarta-sans'
import './design/main.scss'
import { t, toggleLang } from './shared/i18n'

const app = document.querySelector<HTMLDivElement>('#app')!

function render(): void {
  const hash = window.location.hash.replace('#', '').split('&')[0]

  switch (hash) {
    case 'scheduler':
      import('./tools/scheduler/index').then(m => m.mount(app))
      break
    case 'bills':
      import('./tools/bill-splitter/index').then(m => m.mount(app))
      break
    default:
      renderHome()
  }
}

function renderHome(): void {
  app.innerHTML = `
    <div class="page">
      <div class="home-header">
        <div class="logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Junto
        </div>
        <button class="secondary sm" id="lang-btn">${t('nav.lang')}</button>
      </div>

      <div class="home-hero">
        <h1>${t('nav.home')}</h1>
        <p>${t('nav.tagline')}</p>
      </div>

      <div class="tool-cards">
        <a href="#scheduler" class="tool-card">
          <div class="tool-icon">📅</div>
          <div class="tool-info">
            <div class="tool-name">${t('nav.scheduler')}</div>
            <div class="tool-desc">Find when everyone is free</div>
          </div>
          <button class="info-btn" data-modal="scheduler" title="Learn more">i</button>
          <div class="tool-arrow">→</div>
        </a>
        <a href="#bills" class="tool-card">
          <div class="tool-icon">💸</div>
          <div class="tool-info">
            <div class="tool-name">${t('nav.bills')}</div>
            <div class="tool-desc">Split expenses, settle up</div>
          </div>
          <button class="info-btn" data-modal="bills" title="Learn more">i</button>
          <div class="tool-arrow">→</div>
        </a>
      </div>
    </div>
  `

  app.querySelector('#lang-btn')!.addEventListener('click', () => {
    toggleLang()
    renderHome()
  })

  app.querySelectorAll<HTMLButtonElement>('.info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      openModal(btn.dataset['modal'] as 'scheduler' | 'bills')
    })
  })
}

function openModal(tool: 'scheduler' | 'bills'): void {
  const isScheduler = tool === 'scheduler'
  const icon = isScheduler ? '📅' : '💸'
  const title = t(isScheduler ? 'nav.scheduler' : 'nav.bills')
  const desc = t(isScheduler ? 'modal.scheduler_desc' : 'modal.bills_desc')
  const step1 = t(isScheduler ? 'modal.scheduler_step1' : 'modal.bills_step1')
  const step2 = t(isScheduler ? 'modal.scheduler_step2' : 'modal.bills_step2')
  const step3 = t(isScheduler ? 'modal.scheduler_step3' : 'modal.bills_step3')
  const note = t(isScheduler ? 'modal.scheduler_note' : 'modal.bills_note')

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
        <li>${step1}</li>
        <li>${step2}</li>
        <li>${step3}</li>
      </ol>
      <div class="modal-section-title">${t('modal.good_to_know')}</div>
      <div class="modal-note">${note}</div>
    </div>
  `

  document.body.appendChild(backdrop)
  requestAnimationFrame(() => backdrop.classList.add('open'))

  const close = (): void => {
    backdrop.classList.remove('open')
    backdrop.addEventListener('transitionend', () => backdrop.remove(), { once: true })
  }

  backdrop.addEventListener('click', e => { if (e.target === backdrop) close() })
  backdrop.querySelector('#modal-close')!.addEventListener('click', close)

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey) }
  }
  document.addEventListener('keydown', onKey)
}

window.addEventListener('hashchange', render)
render()
