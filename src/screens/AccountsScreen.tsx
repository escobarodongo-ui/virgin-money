import { account } from '../data/account'
import { AppHeader } from '../components/AppHeader'
import { ListRow, SurfaceCard } from '../components/ListRow'
import { ChevronRightIcon, InfoIcon, WalletIcon } from '../components/icons'
import { formatBalance } from '../utils/currency'

interface AccountsScreenProps {
  onOpenAccount: () => void
}

export function AccountsScreen({ onOpenAccount }: AccountsScreenProps) {
  return (
    <div className="bg-app-bg" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 96 }}>
      <AppHeader title="Accounts" />
      <div style={{ marginTop: -22, padding: '0 13px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <SurfaceCard>
          <div
            style={{
              display: 'flex',
              height: 38,
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--line)',
              padding: '0 13px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span
                className="bg-brand text-primary-foreground"
                style={{
                  display: 'grid',
                  width: 20,
                  height: 20,
                  placeItems: 'center',
                  borderRadius: 999,
                  fontSize: 8,
                  fontWeight: 700,
                  fontStyle: 'italic',
                }}
              >
                V
              </span>
              <span className="text-brand" style={{ fontSize: 9, fontWeight: 600 }}>
                money
              </span>
            </span>
            <InfoIcon />
          </div>
          <button type="button" onClick={onOpenAccount} style={{ width: '100%', padding: '12px 13px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <WalletIcon />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{account.name}</div>
                <div className="text-ink-soft" style={{ fontSize: 12 }}>
                  {account.maskedIdentifier}
                </div>
              </div>
              <ChevronRightIcon />
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', paddingLeft: 36 }}>
              <span className="text-ink-soft" style={{ fontSize: 12 }}>
                Available
              </span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{formatBalance(account.availableBalance)}</span>
            </div>
          </button>
        </SurfaceCard>

        <SurfaceCard>
          <ListRow label="Sign up for a new account" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow label="Link accounts from other banks" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow
            label={
              <span>
                Net balance <span className="text-ink-soft">{formatBalance(account.availableBalance)}</span>
              </span>
            }
            divider={false}
          />
        </SurfaceCard>
      </div>
    </div>
  )
}
