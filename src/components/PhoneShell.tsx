import type { ReactNode } from 'react'

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-stage">
      <div className="phone-shell">
        <div className="dynamic-island" aria-hidden>
          <span className="dynamic-island__camera" />
        </div>
        <div className="phone-shell__scroll">{children}</div>
        <div className="phone-shell__home-indicator" aria-hidden />
      </div>
    </div>
  )
}
