import { useState } from 'preact/hooks'
import { t, toggleLang } from '../../shared/i18n'
import { decodeState, buildShareUrl } from '../../shared/url-state'
import { save, load } from '../../shared/storage'
import { copyToClipboard } from '../../shared/utils'
import { SplitterState, Expense, Currency, MultiBillState, Bill, settle, totalCents, fmtMoney, parseCents, nanoid, txnKey, currencySymbol } from './splitter'
import { ExpenseItem, TxnItem } from './components'
import { ToolNav } from '../../shared/components/nav'
import { SecondaryButton } from '../../shared/components/buttons'
import { Accordion } from '../../shared/components'
import './splitter.scss'

const MULTI_KEY = 'multi_bills'
const LEGACY_KEY = 'bills'

function makeDraft(people: string[]) {
  return { description: '', amountStr: '', paidBy: people[0] ?? '', participants: new Set<string>(people) }
}

function makeBill(name: string): Bill {
  return { id: nanoid(), name, state: { people: [], expenses: [] } }
}

function initMultiBillState(): MultiBillState {
  const urlState = decodeState<SplitterState>()
  if (urlState) {
    const bill: Bill = { id: nanoid(), name: 'Shared', state: urlState }
    return { bills: [bill], activeId: bill.id }
  }
  const saved = load<MultiBillState>(MULTI_KEY)
  if (saved?.bills?.length) return saved
  const legacy = load<SplitterState>(LEGACY_KEY)
  if (legacy?.people) {
    const bill: Bill = { id: nanoid(), name: 'Bill 1', state: legacy }
    return { bills: [bill], activeId: bill.id }
  }
  const bill = makeBill('Bill 1')
  return { bills: [bill], activeId: bill.id }
}

export default function BillSplitter() {
  const [multi, setMulti] = useState<MultiBillState>(initMultiBillState)
  const [draft, setDraft] = useState(() => {
    const m = initMultiBillState()
    const active = m.bills.find(b => b.id === m.activeId) ?? m.bills[0]
    return makeDraft(active.state.people)
  })
  const [draftPerson, setDraftPerson] = useState('')
  const [addingPerson, setAddingPerson] = useState(false)
  const [draftErrors, setDraftErrors] = useState<{ description?: string; amount?: string; participants?: string }>({})
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(true)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [tabRenameValue, setTabRenameValue] = useState('')
  const [, forceUpdate] = useState(0)

  const activeBill = multi.bills.find(b => b.id === multi.activeId) ?? multi.bills[0]
  const state = activeBill.state

  function persistMulti(next: MultiBillState) {
    setMulti(next)
    save(MULTI_KEY, next)
  }

  function persist(nextState: SplitterState) {
    persistMulti({
      ...multi,
      bills: multi.bills.map(b => b.id === multi.activeId ? { ...b, state: nextState } : b),
    })
  }

  function switchBill(id: string) {
    const bill = multi.bills.find(b => b.id === id)
    if (!bill || id === multi.activeId) return
    persistMulti({ ...multi, activeId: id })
    setDraft(makeDraft(bill.state.people))
    setDraftPerson('')
    setAddingPerson(false)
    setDraftErrors({})
    setEditingTabId(null)
    window.history.replaceState(null, '', `${window.location.origin}${window.location.pathname}#bills`)
  }

  function addBill() {
    const name = `Bill ${multi.bills.length + 1}`
    const bill = makeBill(name)
    persistMulti({ bills: [...multi.bills, bill], activeId: bill.id })
    setDraft(makeDraft([]))
    setDraftPerson('')
    setAddingPerson(false)
    setDraftErrors({})
    window.history.replaceState(null, '', `${window.location.origin}${window.location.pathname}#bills`)
  }

  function deleteBill(id: string) {
    if (multi.bills.length <= 1) return
    const bills = multi.bills.filter(b => b.id !== id)
    const activeId = id === multi.activeId ? bills[0].id : multi.activeId
    persistMulti({ bills, activeId })
    if (id === multi.activeId) {
      const newActive = bills.find(b => b.id === activeId)!
      setDraft(makeDraft(newActive.state.people))
      setDraftPerson('')
      setAddingPerson(false)
      setDraftErrors({})
    }
  }

  function finishRename() {
    if (!editingTabId) return
    const name = tabRenameValue.trim()
    if (name) {
      persistMulti({ ...multi, bills: multi.bills.map(b => b.id === editingTabId ? { ...b, name } : b) })
    }
    setEditingTabId(null)
  }

  function reset() {
    const empty: SplitterState = { people: [], expenses: [] }
    persist(empty)
    setDraft(makeDraft([]))
    setDraftPerson('')
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
    persist({ ...state, people, expenses })
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
    const errors: typeof draftErrors = {}
    if (!desc) errors.description = t('bills.err_description')
    if (cents === 0) errors.amount = t('bills.err_amount')
    if (participants.length === 0) errors.participants = t('bills.err_participants')
    if (Object.keys(errors).length > 0) { setDraftErrors(errors); return }
    setDraftErrors({})
    const expense: Expense = { id: nanoid(), description: desc, amountCents: cents, paidBy: draft.paidBy, participants }
    const next = { ...state, expenses: [...state.expenses, expense] }
    persist(next)
    setDraft(d => ({ ...d, description: '', amountStr: '' }))
  }

  function removeExpense(id: string) {
    persist({ ...state, expenses: state.expenses.filter(e => e.id !== id) })
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
            <button class="secondary sm ghost" onClick={reset}>{t('common.reset')}</button>
          )}
          <button class="secondary sm" onClick={() => { toggleLang(); forceUpdate(n => n + 1) }}>{t('nav.lang')}</button>
        </div>
      </ToolNav>

      {/* Bill Tabs */}
      <div class="bills-tabs">
        {multi.bills.map(bill => (
          <div
            key={bill.id}
            class={`bill-tab${bill.id === multi.activeId ? ' active' : ''}`}
            onClick={() => switchBill(bill.id)}
          >
            {editingTabId === bill.id ? (
              <input
                class="tab-rename-input"
                value={tabRenameValue}
                autoFocus
                onFocus={e => (e.target as HTMLInputElement).select()}
                onInput={e => setTabRenameValue((e.target as HTMLInputElement).value)}
                onKeyDown={e => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') setEditingTabId(null) }}
                onBlur={finishRename}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                class="tab-name"
                onDblClick={e => { e.stopPropagation(); setEditingTabId(bill.id); setTabRenameValue(bill.name) }}
              >
                {bill.name}
              </span>
            )}
            {multi.bills.length > 1 && (
              <button
                class="tab-close"
                aria-label="Remove bill"
                onClick={e => { e.stopPropagation(); deleteBill(bill.id) }}
              >×</button>
            )}
          </div>
        ))}
        <button class="bill-tab-add" aria-label="Add bill" onClick={addBill}>+</button>
      </div>

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
                    onKeyDown={e => { if (e.key === 'Enter') addExpense() }}
                    onInput={e => {
                      setDraft(d => ({ ...d, description: (e.target as HTMLInputElement).value }))
                      if (draftErrors.description) setDraftErrors(d => ({ ...d, description: undefined }))
                    }} />
                  {draftErrors.description && <span class="field-error">{draftErrors.description}</span>}
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label for="exp-amount" class="field-label">{t('bills.exp_amount')} ({currencySymbol(currency)})</label>
                    <input type="number" min="0.01" step="0.01" id="exp-amount" placeholder={`${t('bills.exp_amount')} (${currencySymbol(currency)})`}
                      value={draft.amountStr}
                      onKeyDown={e => { if (e.key === 'Enter') addExpense() }}
                      onInput={e => {
                        setDraft(d => ({ ...d, amountStr: (e.target as HTMLInputElement).value }))
                        if (draftErrors.amount) setDraftErrors(d => ({ ...d, amount: undefined }))
                      }} />
                    {draftErrors.amount && <span class="field-error">{draftErrors.amount}</span>}
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
                          onChange={e => {
                            setDraft(d => {
                              const participants = new Set(d.participants)
                              if ((e.target as HTMLInputElement).checked) participants.add(p)
                              else participants.delete(p)
                              return { ...d, participants }
                            })
                            if (draftErrors.participants) setDraftErrors(d => ({ ...d, participants: undefined }))
                          }} />
                        <span class="checkbox-name">{p}</span>
                      </label>
                    ))}
                  </div>
                  {draftErrors.participants && <span class="field-error">{draftErrors.participants}</span>}
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
