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
          <div class="tool-arrow">→</div>
        </a>
        <a href="#bills" class="tool-card">
          <div class="tool-icon">💸</div>
          <div class="tool-info">
            <div class="tool-name">${t('nav.bills')}</div>
            <div class="tool-desc">Split expenses, settle up</div>
          </div>
          <div class="tool-arrow">→</div>
        </a>
      </div>
    </div>
  `

  app.querySelector('#lang-btn')!.addEventListener('click', () => {
    toggleLang()
    renderHome()
  })
}

window.addEventListener('hashchange', render)
render()
