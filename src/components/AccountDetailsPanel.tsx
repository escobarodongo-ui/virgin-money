import { account } from '../data/account'
import { ListRow, SurfaceCard } from './ListRow'
import { OverflowDotsIcon } from './icons'

interface AccountDetailsPanelProps {
  expanded: boolean
  onToggle: () => void
  onScheduled?: () => void
  onRoundUps?: () => void
}

export function AccountDetailsPanel({
  expanded,
  onToggle,
  onScheduled,
  onRoundUps,
}: AccountDetailsPanelProps) {
  return (
    <SurfaceCard>
      <ListRow
        label="Account"
        divider={expanded}
        onClick={onToggle}
        right={
          <>
            <span
              className="text-ink-soft"
              style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {account.maskedIdentifier}
            </span>
            <OverflowDotsIcon />
          </>
        }
      />
      {expanded ? (
        <div role="region" aria-label="Account details">
          <ListRow label="Account name" right={<span className="text-ink-soft" style={{ fontSize: 13 }}>{account.name}</span>} />
          <ListRow
            label="Account identifier"
            right={<span className="text-ink-soft" style={{ fontSize: 13 }}>{account.maskedIdentifier}</span>}
          />
          <ListRow label="Account type" right={<span className="text-ink-soft" style={{ fontSize: 13 }}>{account.type}</span>} />
          <ListRow label="Currency" right={<span className="text-ink-soft" style={{ fontSize: 13 }}>{account.currency}</span>} />
          <ListRow
            label="Scheduled activity"
            onClick={onScheduled}
            right={<span className="text-ink-soft" style={{ fontSize: 13 }}>{account.scheduledActivity}</span>}
          />
          <ListRow
            label="Round ups"
            divider={false}
            onClick={onRoundUps}
            right={<span className="text-ink-soft" style={{ fontSize: 13 }}>{account.roundUps}</span>}
          />
        </div>
      ) : (
        <>
          <ListRow label="Scheduled activity" onClick={onScheduled} />
          <ListRow
            label="Round ups"
            divider={false}
            onClick={onRoundUps}
            right={<span className="text-ink-soft" style={{ fontSize: 13 }}>{account.roundUps}</span>}
          />
        </>
      )}
    </SurfaceCard>
  )
}
