export type Currency = 'USD' | 'EUR' | 'PEN'

export type Expense = {
  id: string
  description: string
  amountCents: number
  paidBy: string
  participants: string[]
}

export type SplitterState = {
  people: string[]
  expenses: Expense[]
  paidTxns?: string[]
  currency?: Currency
}

export type Transaction = {
  from: string
  to: string
  amountCents: number
}

export function calcBalances(state: SplitterState): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const p of state.people) balances[p] = 0

  for (const exp of state.expenses) {
    const n = exp.participants.length
    if (n === 0) continue
    const share = Math.floor(exp.amountCents / n)
    const remainder = exp.amountCents - share * n

    balances[exp.paidBy] = (balances[exp.paidBy] ?? 0) + exp.amountCents
    exp.participants.forEach((p, i) => {
      balances[p] = (balances[p] ?? 0) - (share + (i === 0 ? remainder : 0))
    })
  }

  return balances
}

export function settle(state: SplitterState): Transaction[] {
  const bal = calcBalances(state)

  const creditors = Object.entries(bal)
    .filter(([, b]) => b > 0)
    .map(([name, balance]) => ({ name, balance }))
    .sort((a, b) => b.balance - a.balance)

  const debtors = Object.entries(bal)
    .filter(([, b]) => b < 0)
    .map(([name, balance]) => ({ name, balance: -balance }))
    .sort((a, b) => b.balance - a.balance)

  const txns: Transaction[] = []
  let i = 0, j = 0

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].balance, debtors[j].balance)
    if (amount > 0) {
      txns.push({ from: debtors[j].name, to: creditors[i].name, amountCents: amount })
    }
    creditors[i].balance -= amount
    debtors[j].balance -= amount
    if (creditors[i].balance === 0) i++
    if (debtors[j].balance === 0) j++
  }

  return txns
}

export function totalCents(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amountCents, 0)
}

export function txnKey(tx: Transaction): string {
  return `${tx.from}>${tx.to}:${tx.amountCents}`
}

export function currencySymbol(currency: Currency): string {
  if (currency === 'EUR') return '€'
  if (currency === 'PEN') return 'S/'
  return '$'
}

export function fmtMoney(cents: number, currency: Currency = 'USD'): string {
  const val = (cents / 100).toFixed(2)
  if (currency === 'EUR') return `€${val}`
  if (currency === 'PEN') return `S/ ${val}`
  return `$${val}`
}

export function parseCents(str: string): number {
  const val = parseFloat(str)
  if (isNaN(val) || val <= 0) return 0
  return Math.round(val * 100)
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 9)
}
