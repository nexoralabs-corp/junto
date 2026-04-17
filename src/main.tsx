import { render } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import '@fontsource-variable/plus-jakarta-sans'
import './design/main.scss'
import { t, toggleLang } from './shared/i18n'
import Scheduler from './tools/scheduler/Scheduler'
import BillSplitter from './tools/bill-splitter/BillSplitter'
import { Logo, InfoButton, Modal } from './shared/components'

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
    Modal({
      icon: isScheduler ? '📅' : '💸',
      title: t(isScheduler ? 'nav.scheduler' : 'nav.bills'),
      desc: t(isScheduler ? 'modal.scheduler_desc' : 'modal.bills_desc'),
      steps: [
        t(isScheduler ? 'modal.scheduler_step1' : 'modal.bills_step1'),
        t(isScheduler ? 'modal.scheduler_step2' : 'modal.bills_step2'),
        t(isScheduler ? 'modal.scheduler_step3' : 'modal.bills_step3')
      ],
      note: t(isScheduler ? 'modal.scheduler_note' : 'modal.bills_note')
    })
  }

  return (
    <div class="page">
      <nav class="navbar">
        <div class="navbar-inner">
          <a href="#" class="logo">
            <Logo />
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
              <InfoButton />
            </button>
          </a>
          <a href="#bills" class="tool-card">
            <div class="tool-icon">💸</div>
            <div class="tool-info">
              <div class="tool-name">{t('nav.bills')}</div>
              <div class="tool-desc">Split expenses, settle up</div>
            </div>
            <button class="info-btn" title="Learn more" onClick={e => { e.preventDefault(); e.stopPropagation(); openModal('bills') }}>
              <InfoButton />
            </button>
          </a>
        </div>
      </main>
    </div>
  )
}

render(<App />, document.getElementById('app')!)
