import { BackArrowIcon, BellIcon, ChatIcon, MoreCircleIcon } from './icons'
import { StatusBar } from './StatusBar'

interface AppHeaderProps {
  title: string
  onBack?: () => void
  onMore?: () => void
  variant?: 'account' | 'page'
}

export function AppHeader({ title, onBack, onMore, variant = 'page' }: AppHeaderProps) {
  if (variant === 'account') {
    return (
      <div className="bg-brand text-primary-foreground" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
        <StatusBar />
        <div
          style={{
            display: 'grid',
            height: 38,
            gridTemplateColumns: '40px 1fr 40px',
            alignItems: 'center',
            padding: '0 18px',
          }}
        >
          <button type="button" aria-label="Back" onClick={onBack}>
            <BackArrowIcon />
          </button>
          <h1 style={{ margin: 0, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{title}</h1>
          <button type="button" aria-label="More" onClick={onMore} style={{ justifySelf: 'end' }}>
            <MoreCircleIcon />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand text-primary-foreground">
      <StatusBar />
      <div
        style={{
          display: 'flex',
          height: 34,
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 20,
          padding: '0 13px',
        }}
      >
        <ChatIcon />
        <BellIcon />
      </div>
      <h1
        style={{
          margin: 0,
          padding: '4px 13px 36px',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h1>
    </div>
  )
}
