import { t } from '../../shared/i18n'
import { fmtMoney, Currency } from './splitter'

export function ExpenseItem({ description, paidBy, participants, amountCents, currency, onRemove }: {
  description: string
  paidBy: string
  participants: string[]
  amountCents: number
  currency?: Currency
  onRemove?: () => void
}) {
  return (
    <div class="expense-item">
      <div class="expense-info">
        <div class="exp-name">{description}</div>
        <div class="exp-meta">{t('bills.exp_paid_by')}: {paidBy} · {participants.join(', ')}</div>
      </div>
      <span class="exp-amount">{fmtMoney(amountCents, currency)}</span>
      {onRemove && <button class="remove-btn" onClick={onRemove}>{t('common.remove')}</button>}
    </div>
  )
}

export function TxnItem({ from, to, amountCents, currency, paid, onTogglePaid }: {
  from: string
  to: string
  amountCents: number
  currency?: Currency
  paid?: boolean
  onTogglePaid?: () => void
}) {
  return (
    <div class={`txn-item${paid ? ' txn-paid' : ''}`}>
      <span class="txn-names">
        <strong>{from}</strong>
        <span class="txn-arrow">→</span>
        <strong>{to}</strong>
      </span>
      <div class="txn-right">
        <span class="txn-amount">{fmtMoney(amountCents, currency)}</span>
        {onTogglePaid && (
          <button class={`txn-paid-btn${paid ? ' is-paid' : ''}`} onClick={onTogglePaid}>
            {paid ? t('bills.paid') : t('bills.mark_paid')}
          </button>
        )}
      </div>
    </div>
  )
}
