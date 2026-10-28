import { useEffect, useState } from 'react'
import { AccountDetailsPanel } from '../components/AccountDetailsPanel'
import { AccountSummary } from '../components/AccountSummary'
import { AppHeader } from '../components/AppHeader'
import { OverflowMenu } from '../components/OverflowMenu'
import { SurfaceCard } from '../components/ListRow'
import { TransactionDetailPanel } from '../components/TransactionDetailPanel'
import { TransactionList } from '../components/TransactionList'
import { TransactionSearch } from '../components/TransactionSearch'
import type { Transaction } from '../data/transactions'
import { transactions } from '../data/transactions'
import { searchTransactions } from '../utils/search'

interface GoAccountScreenProps {
  onBack: () => void
}

export function GoAccountScreen({ onBack }: GoAccountScreenProps) {
  const [query, setQuery] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filtered = searchTransactions(transactions, query)

  return (
    <div className="bg-app-bg" style={{ minHeight: '100%', position: 'relative' }}>
      <AppHeader
        variant="account"
        title="Go Account"
        onBack={onBack}
        onMore={() => setMenuOpen(true)}
      />
      <AccountSummary />
      <div style={{ marginTop: -34, padding: '0 13px 96px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <AccountDetailsPanel
          expanded={detailsOpen}
          onToggle={() => setDetailsOpen((v) => !v)}
          onScheduled={() => setToast('Scheduled activity settings (demo)')}
          onRoundUps={() => setToast('Round-ups settings (demo)')}
        />

        <SurfaceCard>
          <TransactionSearch
            value={query}
            active={searchActive}
            onChange={setQuery}
            onActivate={() => setSearchActive(true)}
            onCancel={() => {
              setSearchActive(false)
              setQuery('')
            }}
          />
        </SurfaceCard>

        <TransactionList items={filtered} loading={loading} onSelect={setSelected} />

        <p className="disclaimer">
          Unofficial recreation with fictionalised account and transaction records. Not operated by Virgin Money.
        </p>
      </div>

      <OverflowMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenAccountInfo={() => setDetailsOpen(true)}
        onOpenPreferences={() => setToast('Display preferences (demo)')}
        onOpenAbout={() =>
          setToast('Unofficial Virgin Money–inspired demo. No real banking services.')
        }
      />

      <TransactionDetailPanel transaction={selected} onClose={() => setSelected(null)} />

      {toast ? (
        <div
          role="status"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 88,
            zIndex: 50,
            borderRadius: 8,
            background: 'var(--ink)',
            color: 'var(--primary-foreground)',
            padding: '12px 14px',
            fontSize: 13,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
