import { useState } from 'preact/hooks'
import { t, toggleLang } from '../../shared/i18n'
import { decodeState, buildShareUrl } from '../../shared/url-state'
import { save, load, clear } from '../../shared/storage'
import { copyToClipboard } from '../../shared/utils'
import { SplitterState, Expense, settle, totalCents, fmtMoney, parseCents, nanoid } from './splitter'
import './splitter.scss'

const STORAGE_KEY = 'bills'

function initState(): SplitterState {
  return decodeState<SplitterState>() ?? load<SplitterState>(STORAGE_KEY) ?? { people: [], expenses: [] }
}

function makeDraft(people: string[]) {
  return { description: '', amountStr: '', paidBy: people[0] ?? '', participants: new Set<string>(people) }
}

export default function BillSplitter() {
  const [state, setState] = useState<SplitterState>(initState)
  const [draft, setDraft] = useState(() => makeDraft(initState().people))
  const [draftPerson, setDraftPerson] = useState('')
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [, forceUpdate] = useState(0)

  function persist(next: SplitterState) {
    setState(next)
    save(STORAGE_KEY, next)
  }

  function reset() {
    const empty: SplitterState = { people: [], expenses: [] }
    persist(empty)
    setDraft(makeDraft([]))
    setDraftPerson('')
    clear(STORAGE_KEY)
    window.history.replaceState(null, '', `${window.location.origin}${window.location.pathname}#bills`)
  }

  function addPerson() {
    const name = draftPerson.trim()
    if (!name || state.people.includes(name)) return
    const next = { ...state, people: [...state.people, name] }
    persist(next)
    setDraft(d => ({ ...d, participants: new Set([...d.participants, name]), paidBy: d.paidBy || name }))
    setDraftPerson('')
  }

  function removePerson(name: string) {
    const people = state.people.filter(p => p !== name)
    const expenses = state.expenses
      .map(exp => ({ ...exp, participants: exp.participants.filter(p => p !== name) }))
      .filter(exp => exp.participants.length > 0)
    persist({ people, expenses })
    setDraft(d => {
      const participants = new Set(d.participants)
      participants.delete(name)
      return { ...d, participants, paidBy: d.paidBy === name ? (people[0] ?? '') : d.paidBy }
    })
  }

  function addExpense() {
    const desc = draft.description.trim()
    const cents = parseCents(draft.amountStr)
    const participants = [...draft.participants].filter(p => state.people.includes(p))
    if (!desc || cents === 0 || participants.length === 0 || !draft.paidBy) return
    const expense: Expense = { id: nanoid(), description: desc, amountCents: cents, paidBy: draft.paidBy, participants }
    const next = { ...state, expenses: [...state.expenses, expense] }
    persist(next)
    setDraft(d => ({ ...d, description: '', amountStr: '' }))
  }

  function removeExpense(id: string) {
    const next = { ...state, expenses: state.expenses.filter(e => e.id !== id) }
    persist(next)
  }

  async function share() {
    const url = buildShareUrl('bills', state)
    window.history.replaceState(null, '', url)
    await copyToClipboard(url)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2500)
  }

  const txns = state.expenses.length > 0 ? settle(state) : []
  const total = totalCents(state.expenses)
  const hasPeople = state.people.length >= 2

  return (
    <div class="page">
      <nav class="tool-nav">
        <a href="#" class="back-link">{t('common.back')}</a>
        <span class="tool-title">{t('bills.title')}</span>
        <div class="nav-actions">
          {(state.people.length > 0 || state.expenses.length > 0) && (
            <button class="secondary sm ghost" onClick={reset}>{t('common.reset')}</button>
          )}
          <button class="secondary sm" onClick={() => { toggleLang(); forceUpdate(n => n + 1) }}>{t('nav.lang')}</button>
        </div>
      </nav>

      <p class="tool-subtitle">{t('bills.subtitle')}</p>

      {/* People */}
      <section class="section">
        <h3>{t('bills.people')}</h3>
        <div class="chips">
          {state.people.map(p => (
            <span class="chip" key={p}>
              {p}
              <button class="chip-remove" onClick={() => removePerson(p)}>{t('common.remove')}</button>
            </span>
          ))}
        </div>
        <div class="add-row">
          <input type="text" placeholder={t('bills.person_placeholder')}
            value={draftPerson} autocomplete="off"
            onInput={e => setDraftPerson((e.target as HTMLInputElement).value)}
            onKeyDown={e => e.key === 'Enter' && addPerson()} />
          <button class="secondary" onClick={addPerson}>{t('common.add')}</button>
        </div>
      </section>

      {/* Expenses */}
      <section class="section">
        <h3>{t('bills.expenses')}</h3>
        {state.expenses.length > 0 && (
          <div class="expense-list">
            {state.expenses.map(exp => (
              <div class="expense-item" key={exp.id}>
                <div class="expense-info">
                  <div class="exp-name">{exp.description}</div>
                  <div class="exp-meta">{t('bills.exp_paid_by')}: {exp.paidBy} · {exp.participants.join(', ')}</div>
                </div>
                <span class="exp-amount">{fmtMoney(exp.amountCents)}</span>
                <button class="remove-btn" onClick={() => removeExpense(exp.id)}>{t('common.remove')}</button>
              </div>
            ))}
          </div>
        )}
        {state.expenses.length === 0 && <p class="hint-text">{t('bills.no_expenses')}</p>}

        {!hasPeople
          ? <p class="hint-text">{t('bills.need_people')}</p>
          : (
            <div class="expense-form">
              <input type="text" placeholder={t('bills.exp_description_placeholder')}
                value={draft.description} autocomplete="off"
                onInput={e => setDraft(d => ({ ...d, description: (e.target as HTMLInputElement).value }))} />
              <div class="form-row">
                <input type="number" min="0.01" step="0.01" placeholder={t('bills.exp_amount')}
                  value={draft.amountStr}
                  onInput={e => setDraft(d => ({ ...d, amountStr: (e.target as HTMLInputElement).value }))} />
                <select value={draft.paidBy}
                  onChange={e => setDraft(d => ({ ...d, paidBy: (e.target as HTMLSelectElement).value }))}>
                  {state.people.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div class="checkboxes">
                {state.people.map(p => (
                  <label key={p}>
                    <input type="checkbox" value={p} checked={draft.participants.has(p)}
                      onChange={e => setDraft(d => {
                        const participants = new Set(d.participants)
                        if ((e.target as HTMLInputElement).checked) participants.add(p)
                        else participants.delete(p)
                        return { ...d, participants }
                      })} />
                    {p}
                  </label>
                ))}
              </div>
              <button class="secondary full-width" onClick={addExpense}>{t('bills.add_expense')}</button>
            </div>
          )
        }
      </section>

      {/* Settlement */}
      {state.expenses.length > 0 && (
        <section class="section">
          <h3>{t('bills.settlement')}</h3>
          <p class="total-line">{t('bills.total')}: <strong>{fmtMoney(total)}</strong></p>
          {txns.length === 0
            ? <p class="all-settled">{t('bills.all_settled')}</p>
            : (
              <div class="settlement-list">
                {txns.map((tx, i) => (
                  <div class="txn-item" key={i}>
                    <span class="txn-names">
                      <strong>{tx.from}</strong>
                      <span class="txn-arrow">→</span>
                      <strong>{tx.to}</strong>
                    </span>
                    <span class="txn-amount">{fmtMoney(tx.amountCents)}</span>
                  </div>
                ))}
              </div>
            )
          }
          <button class="full-width" onClick={share}>{t('bills.share')}</button>
          {copiedMsg && <p class="feedback success">{t('common.copied')}</p>}
        </section>
      )}
    </div>
  )
}
