import { account } from '../data/account'
import { formatBalance } from '../utils/currency'

export function AccountSummary() {
  return (
    <div className="bg-brand text-primary-foreground" style={{ paddingBottom: 64 }}>
      <div style={{ paddingTop: 4, textAlign: 'center' }}>
        <div style={{ fontSize: 25, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {formatBalance(account.availableBalance)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.95 }}>
          {formatBalance(account.currentBalance)} Current balance
        </div>
      </div>
    </div>
  )
}
