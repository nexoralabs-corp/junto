import { t } from '../../shared/i18n'
import { fmtMoney } from './splitter'

export function ExpenseItem({ description, paidBy, participants, amountCents, onRemove }: {
  description: string
  paidBy: string
  participants: string[]
  amountCents: number
  onRemove?: () => void
}) {
  return (
    <div class="expense-item">
      <div class="expense-info">
        <div class="exp-name">{description}</div>
        <div class="exp-meta">{t('bills.exp_paid_by')}: {paidBy} · {participants.join(', ')}</div>
      </div>
      <span class="exp-amount">{fmtMoney(amountCents)}</span>
      {onRemove && <button class="remove-btn" onClick={onRemove}>{t('common.remove')}</button>}
    </div>
  )
}

export function TxnItem({ from, to, amountCents }: { from: string; to: string; amountCents: number }) {
  return (
    <div class="txn-item">
      <span class="txn-names">
        <strong>{from}</strong>
        <span class="txn-arrow">→</span>
        <strong>{to}</strong>
      </span>
      <span class="txn-amount">{fmtMoney(amountCents)}</span>
    </div>
  )
}
