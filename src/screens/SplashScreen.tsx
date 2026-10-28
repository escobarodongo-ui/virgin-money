import { useEffect, useState } from 'react'
import { MoreCircleIcon, VirginMark } from '../components/icons'
import { StatusBar } from '../components/StatusBar'

interface SplashScreenProps {
  onLogin: () => void
}

export function SplashScreen({ onLogin }: SplashScreenProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 900)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div
      className="bg-brand"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StatusBar />
      {ready ? (
        <div className="splash-content" style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: 42,
              color: 'var(--primary-foreground)',
            }}
          >
            <VirginMark size={22} light />
            <button
              type="button"
              aria-label="More options"
              style={{ position: 'absolute', right: 16, top: 36, color: 'var(--primary-foreground)' }}
            >
              <MoreCircleIcon />
            </button>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ padding: '0 16px 64px' }}>
            <button
              type="button"
              onClick={onLogin}
              style={{
                height: 52,
                width: '100%',
                borderRadius: 8,
                background: 'var(--background)',
                color: 'var(--brand)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Login
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <VirginMark size={28} light />
        </div>
      )}
    </div>
  )
}
