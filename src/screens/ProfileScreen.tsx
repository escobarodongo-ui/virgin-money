import { AppHeader } from '../components/AppHeader'
import { ListRow, SurfaceCard } from '../components/ListRow'

interface ProfileScreenProps {
  onOpenPayId: () => void
}

export function ProfileScreen({ onOpenPayId }: ProfileScreenProps) {
  return (
    <div className="bg-app-bg" style={{ minHeight: '100%', paddingBottom: 96 }}>
      <AppHeader title="Profile" />
      <div style={{ marginTop: -22, padding: '0 13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SurfaceCard>
          <ListRow label="My details" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow label="Security Centre" />
          <ListRow label="Notifications" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow label="Help & Support" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow label="Manage cards" />
          <ListRow label="Manage PayID" onClick={onOpenPayId} />
          <ListRow label="Manage quick balance" />
          <ListRow label="Manage payment limits" />
          <ListRow label="Manage data sharing" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow label="Statements and documents" divider={false} />
        </SurfaceCard>
        <SurfaceCard>
          <ListRow label="Guided tour" />
          <ListRow label="Log out" divider={false} />
        </SurfaceCard>
        <p className="disclaimer">
          Application information: unofficial Virgin Money–inspired recreation. Fictional account and transaction data
          only.
        </p>
      </div>
    </div>
  )
}
