import { AppHeader } from '../components/AppHeader'
import { ListRow, SurfaceCard } from '../components/ListRow'

interface PayScreenProps {
  onOpenPayId: () => void
}

export function PayScreen({ onOpenPayId }: PayScreenProps) {
  return (
    <div className="bg-app-bg" style={{ minHeight: '100%', paddingBottom: 96 }}>
      <AppHeader title="Pay" />
      <div style={{ marginTop: -22, padding: '0 13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SurfaceCard>
          <ListRow label="Pay someone new" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow label="Pay a bill" />
          <ListRow label="BPAY" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow label="Manage PayID" onClick={onOpenPayId} />
          <ListRow label="Scheduled payments" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow
            label="Payment limits"
            divider={false}
            right={<span className="text-ink-soft" style={{ fontSize: 13 }}>View</span>}
          />
        </SurfaceCard>
      </div>
    </div>
  )
}
