import { useState } from 'preact/hooks'
import { t, toggleLang } from '../../shared/i18n'
import { decodeState, buildShareUrl } from '../../shared/url-state'
import { save, load, clear } from '../../shared/storage'
import { copyToClipboard } from '../../shared/utils'
import { SplitterState, Expense, Currency, settle, totalCents, fmtMoney, parseCents, nanoid, txnKey, currencySymbol } from './splitter'
import { ExpenseItem, TxnItem } from './components'
import { ToolNav } from '../../shared/components/nav'
import { SecondaryButton } from '../../shared/components/buttons'
import { Accordion } from '../../shared/components'
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
  const [addingPerson, setAddingPerson] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(true)

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
    if (!name || state.people.includes(name)) { setDraftPerson(''); setAddingPerson(false); return }
    const next = { ...state, people: [...state.people, name] }
    persist(next)
    setDraft(d => ({ ...d, participants: new Set([...d.participants, name]), paidBy: d.paidBy || name }))
    setDraftPerson('')
    setAddingPerson(false)
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

  function togglePaid(key: string) {
    const paidTxns = state.paidTxns ?? []
    const next = paidTxns.includes(key) ? paidTxns.filter(k => k !== key) : [...paidTxns, key]
    persist({ ...state, paidTxns: next })
  }

  function setCurrency(currency: Currency) {
    persist({ ...state, currency })
  }

  async function share() {
    const url = buildShareUrl('bills', state)
    window.history.replaceState(null, '', url)
    await copyToClipboard(url)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2500)
  }
  const currency = state.currency ?? 'USD'
  const total = totalCents(state.expenses)
  const hasPeople = state.people.length >= 2
  const txns = state.expenses.length > 0 ? settle(state) : []
  const paidTxns = state.paidTxns ?? []
  const unpaidTxns = txns.filter(tx => !paidTxns.includes(txnKey(tx)))
  const paidAmountCents = txns.filter(tx => paidTxns.includes(txnKey(tx))).reduce((s, tx) => s + tx.amountCents, 0)
  const pendingAmountCents = unpaidTxns.reduce((s, tx) => s + tx.amountCents, 0)
  const allPaid = txns.length > 0 && unpaidTxns.length === 0



  return (
    <div class="page">
      <ToolNav
        onBack={reset}
        title={t('bills.title')}
        subtitle={t('bills.subtitle')}
      >
        <div class="nav-actions">
          {(state.people.length > 0 || state.expenses.length > 0) && (
            <button class="secondary sm ghost">{t('common.reset')}</button>
          )}
          <button class="secondary sm" onClick={() => toggleLang()}>{t('nav.lang')}</button>
        </div>
      </ToolNav>

      <div class="currency-bar">
        <span class="currency-label">{t('bills.currency')}:</span>
        {(['USD', 'EUR', 'PEN'] as Currency[]).map(c => (
          <button
            key={c}
            class={`currency-btn${currency === c ? ' active' : ''}`}
            onClick={() => setCurrency(c)}
          >
            {c === 'USD' ? '$ USD' : c === 'EUR' ? '€ EUR' : 'S/ PEN'}
          </button>
        ))}
      </div>

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
          {!addingPerson && (
            <button class="chip chip-add" onClick={() => setAddingPerson(true)}>+</button>
          )}
        </div>
        {addingPerson && (
          <div class="add-row">
            <input type="text" placeholder={t('bills.person_placeholder')}
              value={draftPerson} autocomplete="off"
              ref={(el: HTMLInputElement | null) => { if (el) el.focus() }}
              onInput={e => setDraftPerson((e.target as HTMLInputElement).value)}
              onKeyDown={e => { if (e.key === 'Enter') addPerson(); if (e.key === 'Escape') { setDraftPerson(''); setAddingPerson(false); } }}
              onBlur={() => { if (!draftPerson.trim()) { setDraftPerson(''); setAddingPerson(false); } }} />
            <button class="secondary" onClick={addPerson}>{t('common.add')}</button>
          </div>
        )}
      </section>

      {/* Expenses */}
      <section class="section">
        {!hasPeople
          ? <p class="hint-text">{t('bills.need_people')}</p>
          : (
            <Accordion title={t('bills.add_expense')}>
              <div class="expense-form">
                <div class="form-group">
                  <input type="text" placeholder={t('bills.exp_description_placeholder')}
                    value={draft.description} autocomplete="off"
                    onInput={e => setDraft(d => ({ ...d, description: (e.target as HTMLInputElement).value }))} />
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label for="exp-amount" class="field-label">{t('bills.exp_amount')} ({currencySymbol(currency)})</label>
                    <input type="number" min="0.01" step="0.01" id="exp-amount" placeholder={`${t('bills.exp_amount')} (${currencySymbol(currency)})`}
                      value={draft.amountStr}
                      onInput={e => setDraft(d => ({ ...d, amountStr: (e.target as HTMLInputElement).value }))} />
                  </div>
                  <div class="form-field">
                    <label for="paid-by" class="field-label">{t('bills.exp_paid_by')}</label>
                    <select id="paid-by" value={draft.paidBy}
                      onChange={e => setDraft(d => ({ ...d, paidBy: (e.target as HTMLSelectElement).value }))}>
                      {state.people.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <div class="participants-header">
                    <label class="checkbox-label">{t('bills.participants_label')}</label>
                    <div class="participants-actions">
                      <SecondaryButton sm onClick={() => setDraft(d => ({ ...d, participants: new Set(state.people) }))}>
                        {t('bills.select_all')}
                      </SecondaryButton>
                      <SecondaryButton sm onClick={() => setDraft(d => ({ ...d, participants: new Set<string>() }))}>
                        {t('bills.deselect_all')}
                      </SecondaryButton>
                    </div>
                  </div>
                  <div class="checkbox-list">
                    {state.people.map(p => (
                      <label key={p} class="checkbox-item">
                        <input type="checkbox" value={p} checked={draft.participants.has(p)}
                          onChange={e => setDraft(d => {
                            const participants = new Set(d.participants)
                            if ((e.target as HTMLInputElement).checked) participants.add(p)
                            else participants.delete(p)
                            return { ...d, participants }
                          })} />
                        <span class="checkbox-name">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button class="full-width" onClick={addExpense}>{t('bills.add_expense')}</button>
              </div>
            </Accordion>
          )
        }

        {state.expenses.length > 0 && (
          <Accordion title={`${t('bills.expenses')} (${state.expenses.length})`} defaultOpen>
            <div class="expense-list">
              {state.expenses.map(exp => (
                <ExpenseItem
                  key={exp.id}
                  description={exp.description}
                  paidBy={exp.paidBy}
                  participants={exp.participants}
                  amountCents={exp.amountCents}
                  currency={currency}
                  onRemove={() => removeExpense(exp.id)}
                />
              ))}
            </div>
          </Accordion>
        )}
      </section>

      {/* Settlement */}
      {state.expenses.length > 0 && (
        <section class="section">
          <p class="total-line">{t('bills.total')}: <strong>{fmtMoney(total, currency)}</strong></p>
          {txns.length === 0
            ? <p class="all-settled">{t('bills.all_settled')}</p>
            : (
              <Accordion title={t('bills.settlement')} open={settlementOpen} onToggle={setSettlementOpen}>
                <div class="settlement-list">
                  {txns.map((tx, i) => {
                    const key = txnKey(tx)
                    return (
                      <TxnItem
                        key={i}
                        from={tx.from}
                        to={tx.to}
                        amountCents={tx.amountCents}
                        currency={currency}
                        paid={paidTxns.includes(key)}
                        onTogglePaid={() => togglePaid(key)}
                      />
                    )
                  })}
                </div>
                {allPaid
                  ? <p class="all-settled">{t('bills.all_settled')}</p>
                  : paidAmountCents > 0 && (
                    <p class="settlement-summary">
                      <span class="summary-paid">{t('bills.summary_paid')}: <strong>{fmtMoney(paidAmountCents, currency)}</strong></span>
                      <span class="summary-pending">{t('bills.summary_pending')}: <strong>{fmtMoney(pendingAmountCents, currency)}</strong></span>
                    </p>
                  )
                }
              </Accordion>
            )
          }
          <button class="full-width" onClick={share}>{t('bills.share')}</button>
          {copiedMsg && <p class="feedback success">{t('common.copied')}</p>}
        </section>
      )}
    </div>
  )
}
