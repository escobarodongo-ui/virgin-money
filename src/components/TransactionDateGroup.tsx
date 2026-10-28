import type { Transaction } from '../data/transactions'
import { TransactionRow } from './TransactionRow'

interface TransactionDateGroupProps {
  label: string
  items: Transaction[]
  onSelect: (tx: Transaction) => void
}

export function TransactionDateGroup({ label, items, onSelect }: TransactionDateGroupProps) {
  return (
    <section>
      <h2 className="date-heading">{label}</h2>
      <div className="surface-card">
        {items.map((tx, index) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            showDivider={index < items.length - 1}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}
