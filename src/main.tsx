import { render } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import '@fontsource-variable/plus-jakarta-sans'
import './design/main.scss'
import { t, toggleLang } from './shared/i18n'
import Scheduler from './tools/scheduler/Scheduler'
import BillSplitter from './tools/bill-splitter/BillSplitter'

function App() {
  const [hash, setHash] = useState(() => window.location.hash.replace('#', '').split('&')[0])

  useEffect(() => {
    const onHash = () => setHash(window.location.hash.replace('#', '').split('&')[0])
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (hash === 'scheduler') return <Scheduler />
  if (hash === 'bills') return <BillSplitter />
  return <Home />
}

function Home() {
  const [, setLang] = useState(0)

  function openModal(tool: 'scheduler' | 'bills') {
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

  return (
    <div class="page">
      <nav class="navbar">
        <div class="navbar-inner">
          <a href="#" class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Junto</span>
          </a>
          <button class="secondary sm" onClick={() => { toggleLang(); setLang(n => n + 1) }}>{t('nav.lang')}</button>
        </div>
      </nav>
      <main class="content">
        <div class="home-header">
          <h1>{t('nav.home')}</h1>
          <p>{t('nav.tagline')}</p>
        </div>
        <div class="tool-cards">
          <a href="#scheduler" class="tool-card">
            <div class="tool-icon">📅</div>
            <div class="tool-info">
              <div class="tool-name">{t('nav.scheduler')}</div>
              <div class="tool-desc">Find when everyone is free</div>
            </div>
            <button class="info-btn" title="Learn more" onClick={e => { e.preventDefault(); e.stopPropagation(); openModal('scheduler') }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7.5" cy="7.5" r="6.75" stroke="currentColor" stroke-width="1.5"/>
                <rect x="7" y="6.5" width="1" height="4.5" rx="0.5" fill="currentColor"/>
                <rect x="6.75" y="4" width="1.5" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
            </button>
          </a>
          <a href="#bills" class="tool-card">
            <div class="tool-icon">💸</div>
            <div class="tool-info">
              <div class="tool-name">{t('nav.bills')}</div>
              <div class="tool-desc">Split expenses, settle up</div>
            </div>
            <button class="info-btn" title="Learn more" onClick={e => { e.preventDefault(); e.stopPropagation(); openModal('bills') }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7.5" cy="7.5" r="6.75" stroke="currentColor" stroke-width="1.5"/>
                <rect x="7" y="6.5" width="1" height="4.5" rx="0.5" fill="currentColor"/>
                <rect x="6.75" y="4" width="1.5" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
            </button>
          </a>
        </div>
      </main>
    </div>
  )
}

render(<App />, document.getElementById('app')!)
