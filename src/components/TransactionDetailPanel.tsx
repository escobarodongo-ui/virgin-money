import { useEffect } from 'react'
import type { Transaction } from '../data/transactions'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/dates'

interface TransactionDetailPanelProps {
  transaction: Transaction | null
  onClose: () => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '12px 13px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500, color: 'var(--ink)', overflowWrap: 'anywhere' }}>
        {value}
      </div>
    </div>
  )
}

export function TransactionDetailPanel({ transaction, onClose }: TransactionDetailPanelProps) {
  useEffect(() => {
    if (!transaction) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [transaction, onClose])

  if (!transaction) return null

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Transaction details">
      <button type="button" className="sheet__handle-space" aria-label="Dismiss transaction details" onClick={onClose} />
      <div className="sheet__panel">
        <div
          style={{
            display: 'grid',
            height: 48,
            gridTemplateColumns: '60px 1fr 60px',
            alignItems: 'center',
            padding: '0 13px',
          }}
        >
          <button
            type="button"
            className="text-brand"
            style={{ textAlign: 'left', fontSize: 13, fontWeight: 600 }}
            onClick={onClose}
            aria-label="Close transaction details"
          >
            Close
          </button>
          <h2 className="text-ink" style={{ margin: 0, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
            Transaction
          </h2>
        </div>
        <div style={{ padding: '8px 13px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflowWrap: 'anywhere' }}>
            {transaction.title}
          </div>
          <div
            className={transaction.amount > 0 ? 'text-positive' : 'text-ink'}
            style={{ marginTop: 8, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            {formatCurrency(transaction.amount)}
          </div>
        </div>
        <div className="surface-card" style={{ margin: '0 13px 24px' }}>
          <Field label="Date and time" value={formatDateTime(transaction.date, transaction.time)} />
          <Field label="Category" value={transaction.category.replaceAll('_', ' ')} />
          <Field label="Status" value={transaction.status} />
          {transaction.merchant ? <Field label="Merchant" value={transaction.merchant} /> : null}
          {transaction.location ? <Field label="Location" value={transaction.location} /> : null}
          <Field label="Reference" value={transaction.reference} />
          <Field label="Description" value={transaction.sub} />
        </div>
        <p className="disclaimer" style={{ marginTop: 0 }}>
          Fictional demonstration data. This is an unofficial interface recreation and is not affiliated with Virgin Money.
        </p>
      </div>
    </div>
  )
}
