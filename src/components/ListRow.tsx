import type { ReactNode } from 'react'
import { ChevronRightIcon } from './icons'

interface ListRowProps {
  label: ReactNode
  right?: ReactNode
  onClick?: () => void
  divider?: boolean
}

export function ListRow({ label, right, onClick, divider = true }: ListRowProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="list-row" onClick={onClick} type={onClick ? 'button' : undefined}>
      <span className="list-row__label">{label}</span>
      <span className="list-row__right">{right ?? <ChevronRightIcon />}</span>
      {divider ? <span className="list-row__divider" /> : null}
    </Tag>
  )
}

export function SurfaceCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`surface-card ${className}`.trim()}>{children}</div>
}
