import { AppHeader } from '../components/AppHeader'
import { SurfaceCard } from '../components/ListRow'

export function RewardsScreen() {
  return (
    <div className="bg-app-bg" style={{ minHeight: '100%', paddingBottom: 96 }}>
      <AppHeader title="Rewards" />
      <div style={{ marginTop: -22, padding: '0 13px' }}>
        <SurfaceCard>
          <div style={{ padding: '28px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Virgin Money Rewards</div>
            <p className="text-ink-soft" style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.4 }}>
              Explore offers and points in this unofficial demo. No real rewards programs are connected.
            </p>
            <button type="button" className="text-brand" style={{ marginTop: 16, fontSize: 13, fontWeight: 600 }}>
              Browse offers
            </button>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}
