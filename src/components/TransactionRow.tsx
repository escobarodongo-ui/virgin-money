import type { Transaction } from '../data/transactions'
import { formatCurrency } from '../utils/currency'
import { CardIcon, DepositIcon, TransferIcon } from './icons'

interface TransactionRowProps {
  transaction: Transaction
  showDivider: boolean
  onSelect: (tx: Transaction) => void
}

function CategoryIcon({ icon }: { icon: Transaction['icon'] }) {
  if (icon === 'card') return <CardIcon />
  if (icon === 'deposit') return <DepositIcon />
  return <TransferIcon />
}

export function TransactionRow({ transaction, showDivider, onSelect }: TransactionRowProps) {
  const positive = transaction.amount > 0
  return (
    <button type="button" className="tx-row" onClick={() => onSelect(transaction)}>
      <span className="tx-row__icon">
        <CategoryIcon icon={transaction.icon} />
      </span>
      <span className="tx-row__body">
        <span className="tx-row__title">{transaction.title}</span>
        <span className="tx-row__sub">{transaction.sub}</span>
      </span>
      <span className="tx-row__meta">
        <span className={`tx-row__amount ${positive ? 'text-positive' : 'text-ink'}`}>
          {formatCurrency(transaction.amount)}
        </span>
        {transaction.pending ? <span className="tx-row__pending">Pending</span> : null}
      </span>
      {showDivider ? (
        <span
          className="tx-row__divider"
          style={{ left: transaction.icon === 'card' ? 71 : 71 }}
        />
      ) : null}
    </button>
  )
}
