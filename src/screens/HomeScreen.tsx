import { account } from '../data/account'
import { AppHeader } from '../components/AppHeader'
import { ListRow, SurfaceCard } from '../components/ListRow'
import { AlertIcon, CardActivateIcon, ChevronRightIcon, WalletIcon } from '../components/icons'
import { formatBalance } from '../utils/currency'

interface HomeScreenProps {
  onOpenAccount: () => void
}

export function HomeScreen({ onOpenAccount }: HomeScreenProps) {
  return (
    <div className="bg-app-bg" style={{ minHeight: '100%', paddingBottom: 96 }}>
      <AppHeader title={`Hi ${account.ownerFirstName}`} />
      <div style={{ marginTop: -22, padding: '0 13px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <SurfaceCard>
          <ListRow label="Quick balance" divider={false} />
          <button
            type="button"
            onClick={onOpenAccount}
            style={{ width: '100%', padding: '4px 13px 12px', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <WalletIcon />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{account.name}</span>
              <ChevronRightIcon />
            </div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', paddingLeft: 38 }}>
              <span className="text-ink-soft" style={{ fontSize: 12 }}>
                Available
              </span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{formatBalance(account.availableBalance)}</span>
            </div>
          </button>
        </SurfaceCard>

        <SurfaceCard>
          <div style={{ display: 'flex', gap: 12, padding: '12px 13px' }}>
            <AlertIcon />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Bank Impersonation Scam Alert</div>
              <p className="text-ink-soft" style={{ margin: '4px 0 0', fontSize: 12, lineHeight: '15.5px' }}>
                Be cautious of anyone claiming to be from Virgin Money asking you to take urgent action or provide
                sensitive info.
              </p>
              <button type="button" className="text-brand" style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>
                Learn more
              </button>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <ListRow
            label="Get set up"
            right={
              <>
                <span
                  className="bg-brand text-primary-foreground"
                  style={{
                    display: 'grid',
                    width: 18,
                    height: 18,
                    placeItems: 'center',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  3
                </span>
                <ChevronRightIcon />
              </>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 13px', textAlign: 'center' }}>
            <CardActivateIcon />
            <p style={{ margin: '16px 0 0', fontSize: 13, fontWeight: 500 }}>
              Got your debit card and ready to start spending?
            </p>
            <button type="button" className="text-brand" style={{ marginTop: 16, fontSize: 13, fontWeight: 600 }}>
              Activate your card
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <ListRow label="Track spending" divider={false} />
        </SurfaceCard>

        <p className="disclaimer">
          Unofficial interface recreation for demonstration only. Not affiliated with or operated by Virgin Money.
        </p>
      </div>
    </div>
  )
}
