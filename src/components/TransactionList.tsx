import type { Transaction } from '../data/transactions'
import { groupTransactionsByDate } from '../utils/groupTransactions'
import { TransactionDateGroup } from './TransactionDateGroup'

interface TransactionListProps {
  items: Transaction[]
  loading?: boolean
  onSelect: (tx: Transaction) => void
}

export function TransactionList({ items, loading, onSelect }: TransactionListProps) {
  if (loading) {
    return (
      <div className="loading-dots" aria-label="Loading transactions">
        <span />
        <span />
        <span />
        <span />
      </div>
    )
  }

  const groups = groupTransactionsByDate(items)

  if (groups.length === 0) {
    return (
      <p className="text-ink-soft" style={{ margin: 0, padding: '24px 13px', textAlign: 'center', fontSize: 12 }}>
        No transactions found
      </p>
    )
  }

  return (
    <>
      {groups.map((group) => (
        <TransactionDateGroup
          key={group.date}
          label={group.label}
          items={group.items}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}
