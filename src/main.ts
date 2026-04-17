import '@picocss/pico/css/pico.min.css'
import './design/tokens.css'

const app = document.querySelector<HTMLDivElement>('#app')!

function render() {
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

function renderHome() {
  app.innerHTML = `
    <main class="container">
      <hgroup>
        <h1>Junto</h1>
        <p>Tools for small groups. No accounts. No servers. Just links.</p>
      </hgroup>
      <div class="grid">
        <a href="#scheduler" role="button" class="outline">Sync Times</a>
        <a href="#bills" role="button" class="outline">Bill Splitter</a>
      </div>
    </main>
  `
}

window.addEventListener('hashchange', render)
render()
