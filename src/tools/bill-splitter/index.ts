import { t, toggleLang } from '../../shared/i18n'
import { decodeState, buildShareUrl } from '../../shared/url-state'
import { copyToClipboard } from '../../shared/utils'
import {
  SplitterState, Expense, settle, totalCents, fmtMoney, parseCents, nanoid,
} from './splitter'
import './splitter.scss'

let state: SplitterState = { people: [], expenses: [] }

let draft = {
  description: '',
  amountStr: '',
  paidBy: '',
  participants: new Set<string>(),
}

let draftPerson = ''
let root: HTMLElement

export function mount(container: HTMLElement): void {
  root = container
  const urlState = decodeState<SplitterState>()
  state = urlState ?? { people: [], expenses: [] }
  resetDraft()
  render()
}

function resetDraft(): void {
  draft = {
    description: '',
    amountStr: '',
    paidBy: state.people[0] ?? '',
    participants: new Set(state.people),
  }
}

function render(): void {
  const txns = state.expenses.length > 0 ? settle(state) : []
  const total = totalCents(state.expenses)
  const hasPeople = state.people.length >= 2

  root.innerHTML = `
    <div class="page">
      <nav class="tool-nav">
        <a href="#" class="back-link">${t('common.back')}</a>
        <span class="tool-title">${t('bills.title')}</span>
        <button class="secondary sm" id="lang-btn">${t('nav.lang')}</button>
      </nav>

      <p class="tool-subtitle">${t('bills.subtitle')}</p>

      <!-- PEOPLE -->
      <section class="section">
        <h3>${t('bills.people')}</h3>
        <div class="chips" id="people-list">
          ${state.people.map(p => `
            <span class="chip">
              ${p}
              <button class="chip-remove" data-remove-person="${p}">${t('common.remove')}</button>
            </span>
          `).join('')}
        </div>
        <div class="add-row">
          <input id="person-input" type="text"
            placeholder="${t('bills.person_placeholder')}"
            value="${draftPerson}" autocomplete="off" />
          <button class="secondary" id="add-person-btn">${t('common.add')}</button>
        </div>
      </section>

      <!-- EXPENSES -->
      <section class="section">
        <h3>${t('bills.expenses')}</h3>

        ${state.expenses.length > 0 ? `
          <div class="expense-list" id="expense-list">
            ${state.expenses.map(exp => `
              <div class="expense-item">
                <div class="expense-info">
                  <div class="exp-name">${exp.description}</div>
                  <div class="exp-meta">${t('bills.exp_paid_by')}: ${exp.paidBy} · ${exp.participants.join(', ')}</div>
                </div>
                <span class="exp-amount">${fmtMoney(exp.amountCents)}</span>
                <button class="remove-btn" data-remove-expense="${exp.id}">${t('common.remove')}</button>
              </div>
            `).join('')}
          </div>
        ` : `<p class="hint-text">${t('bills.no_expenses')}</p>`}

        ${!hasPeople
          ? `<p class="hint-text">${t('bills.need_people')}</p>`
          : `<div class="expense-form">
              <input id="exp-desc" type="text"
                placeholder="${t('bills.exp_description_placeholder')}"
                value="${draft.description}" autocomplete="off" />
              <div class="form-row">
                <input id="exp-amount" type="number" min="0.01" step="0.01"
                  placeholder="${t('bills.exp_amount')}"
                  value="${draft.amountStr}" />
                <select id="exp-paidby">
                  ${state.people.map(p =>
                    `<option value="${p}" ${draft.paidBy === p ? 'selected' : ''}>${p}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="checkboxes">
                ${state.people.map(p => `
                  <label>
                    <input type="checkbox" value="${p}"
                      ${draft.participants.has(p) ? 'checked' : ''}
                      class="participant-check" />
                    ${p}
                  </label>
                `).join('')}
              </div>
              <button class="secondary full-width" id="add-expense-btn">${t('bills.add_expense')}</button>
            </div>`
        }
      </section>

      <!-- SETTLEMENT -->
      ${state.expenses.length > 0 ? `
        <section class="section">
          <h3>${t('bills.settlement')}</h3>
          <p class="total-line">${t('bills.total')}: <strong>${fmtMoney(total)}</strong></p>
          ${txns.length === 0
            ? `<p class="all-settled">${t('bills.all_settled')}</p>`
            : `<div class="settlement-list">
                ${txns.map(tx => `
                  <div class="txn-item">
                    <span class="txn-names">
                      <strong>${tx.from}</strong>
                      <span class="txn-arrow">→</span>
                      <strong>${tx.to}</strong>
                    </span>
                    <span class="txn-amount">${fmtMoney(tx.amountCents)}</span>
                  </div>
                `).join('')}
              </div>`
          }
          <button id="share-btn" class="full-width">${t('bills.share')}</button>
          <p id="share-feedback" class="feedback success" hidden></p>
        </section>
      ` : ''}
    </div>
  `

  bindEvents()
}

function bindEvents(): void {
  root.querySelector('#lang-btn')!.addEventListener('click', () => {
    toggleLang()
    render()
  })

  const personInput = root.querySelector<HTMLInputElement>('#person-input')!
  personInput.addEventListener('input', e => { draftPerson = (e.target as HTMLInputElement).value })
  personInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPerson() })
  root.querySelector('#add-person-btn')!.addEventListener('click', addPerson)

  root.querySelector('#people-list')!.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-remove-person]')
    if (!btn) return
    const name = btn.dataset['removePerson']!
    state.people = state.people.filter(p => p !== name)
    state.expenses = state.expenses
      .map(exp => ({ ...exp, participants: exp.participants.filter(p => p !== name) }))
      .filter(exp => exp.participants.length > 0)
    if (draft.paidBy === name) draft.paidBy = state.people[0] ?? ''
    draft.participants.delete(name)
    render()
  })

  root.querySelector('#expense-list')?.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-remove-expense]')
    if (!btn) return
    state.expenses = state.expenses.filter(exp => exp.id !== btn.dataset['removeExpense'])
    render()
  })

  root.querySelector<HTMLInputElement>('#exp-desc')?.addEventListener('input', e => {
    draft.description = (e.target as HTMLInputElement).value
  })
  root.querySelector<HTMLInputElement>('#exp-amount')?.addEventListener('input', e => {
    draft.amountStr = (e.target as HTMLInputElement).value
  })
  root.querySelector<HTMLSelectElement>('#exp-paidby')?.addEventListener('change', e => {
    draft.paidBy = (e.target as HTMLSelectElement).value
  })
  root.querySelectorAll<HTMLInputElement>('.participant-check').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) draft.participants.add(cb.value)
      else draft.participants.delete(cb.value)
    })
  })
  root.querySelector('#add-expense-btn')?.addEventListener('click', addExpense)

  root.querySelector('#share-btn')?.addEventListener('click', async () => {
    const url = buildShareUrl('bills', state)
    window.history.replaceState(null, '', url)
    await copyToClipboard(url)
    const fb = root.querySelector<HTMLElement>('#share-feedback')!
    fb.hidden = false
    fb.textContent = t('common.copied')
    setTimeout(() => { fb.hidden = true }, 2500)
  })
}

function addPerson(): void {
  const name = draftPerson.trim()
  if (!name || state.people.includes(name)) return
  state.people.push(name)
  draft.participants.add(name)
  if (!draft.paidBy) draft.paidBy = name
  draftPerson = ''
  render()
}

function addExpense(): void {
  const desc = draft.description.trim()
  const cents = parseCents(draft.amountStr)
  const participants = [...draft.participants].filter(p => state.people.includes(p))
  if (!desc || cents === 0 || participants.length === 0 || !draft.paidBy) return

  const expense: Expense = {
    id: nanoid(),
    description: desc,
    amountCents: cents,
    paidBy: draft.paidBy,
    participants,
  }
  state.expenses.push(expense)
  draft.description = ''
  draft.amountStr = ''
  render()
}
