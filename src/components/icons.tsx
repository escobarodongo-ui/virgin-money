import type { SVGProps } from 'react'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

type IconProps = SVGProps<SVGSVGElement>

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg width={9} height={14} viewBox="0 0 9 14" {...stroke} strokeWidth={1.7} className="shrink-0 text-ink-soft" {...props}>
      <path d="M2 1.5 7.5 7 2 12.5" />
    </svg>
  )
}

export function BackArrowIcon(props: IconProps) {
  return (
    <svg width={22} height={18} viewBox="0 0 22 18" {...stroke} strokeWidth={2} {...props}>
      <path d="M21 9H2M9 1.5 1.5 9 9 16.5" />
    </svg>
  )
}

export function MoreCircleIcon(props: IconProps) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" {...stroke} strokeWidth={1.7} {...props}>
      <circle cx={12} cy={12} r={10.5} />
      <circle cx={7.5} cy={12} r={1} fill="currentColor" />
      <circle cx={12} cy={12} r={1} fill="currentColor" />
      <circle cx={16.5} cy={12} r={1} fill="currentColor" />
    </svg>
  )
}

export function OverflowDotsIcon(props: IconProps) {
  return (
    <svg width={4} height={16} viewBox="0 0 4 16" className="text-ink" {...props}>
      <circle cx={2} cy={2} r={1.6} fill="currentColor" />
      <circle cx={2} cy={8} r={1.6} fill="currentColor" />
      <circle cx={2} cy={14} r={1.6} fill="currentColor" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg width={17} height={17} viewBox="0 0 17 17" {...stroke} className="text-ink" {...props}>
      <circle cx={7.2} cy={7.2} r={5.7} />
      <path d="m11.4 11.4 4.3 4.3" />
    </svg>
  )
}

export function ChatIcon(props: IconProps) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" {...stroke} {...props}>
      <path d="M3 3.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.5 3.5v-3.5H3a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" />
      <circle cx={7} cy={10} r={0.9} fill="currentColor" />
      <circle cx={11} cy={10} r={0.9} fill="currentColor" />
      <circle cx={15} cy={10} r={0.9} fill="currentColor" />
    </svg>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <svg width={20} height={22} viewBox="0 0 20 22" {...stroke} {...props}>
      <path d="M10 2a6 6 0 0 0-6 6v4.5L2 16h16l-2-3.5V8a6 6 0 0 0-6-6ZM7.5 18.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" {...stroke} className="text-ink" {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 11v5M12 8v.1" />
    </svg>
  )
}

export function TransferIcon(props: IconProps) {
  return (
    <svg width={40} height={40} viewBox="0 0 32 32" {...stroke} strokeWidth={1.5} className="text-ink" {...props}>
      <circle cx={16} cy={16} r={14.5} />
      <path d="M8.6 4.6 4.6 8.6M4.6 8.6l.1-3.4M4.6 8.6l3.4-.1" transform="translate(4 6) scale(0.75)" />
      <path d="M23.4 27.4l4-4M27.4 23.4l-.1 3.4M27.4 23.4l-3.4.1" transform="translate(4 6) scale(0.75)" />
      <path d="M11 13h10M12.4 14.1H11a1 1 0 0 0 0 2h1.2a1 1 0 0 1 0 2H11" />
    </svg>
  )
}

export function CardIcon(props: IconProps) {
  return (
    <svg width={40} height={40} viewBox="0 0 32 32" {...stroke} strokeWidth={1.6} className="text-ink" {...props}>
      <rect x={4} y={8} width={24} height={16} rx={2.5} />
      <path d="M4 13h24" />
      <path d="M8 19h6" />
    </svg>
  )
}

export function DepositIcon(props: IconProps) {
  return (
    <svg width={40} height={40} viewBox="0 0 32 32" {...stroke} strokeWidth={1.6} className="text-ink" {...props}>
      <circle cx={16} cy={16} r={14.5} />
      <path d="M16 10v9M12.5 15.5 16 19l3.5-3.5" />
      <path d="M11 22h10" />
    </svg>
  )
}

export function WalletIcon(props: IconProps) {
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" {...stroke} strokeWidth={1.5} className="text-ink" {...props}>
      <path d="M5 8.5h18a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 23 23.5H5A1.5 1.5 0 0 1 3.5 22V10A1.5 1.5 0 0 1 5 8.5Z" />
      <path d="M3.5 12.5h21" />
      <circle cx={20} cy={17.5} r={1.2} fill="currentColor" />
      <path d="M8 8.5V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1.5" />
    </svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" {...stroke} strokeWidth={1.4} className="text-ink" {...props}>
      <path d="M14 4 24.5 22.5H3.5Z" />
      <path d="M14 12v5M14 19.5v.2" />
    </svg>
  )
}

export function CardActivateIcon(props: IconProps) {
  return (
    <svg width={56} height={40} viewBox="0 0 56 40" {...stroke} strokeWidth={1.4} className="text-ink" {...props}>
      <rect x={4} y={6} width={48} height={28} rx={4} />
      <path d="M4 14h48" />
      <path d="M12 24h14" />
      <circle cx={42} cy={24} r={3} />
    </svg>
  )
}

export function HomeNavIcon({ active }: { active?: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" {...stroke} strokeWidth={active ? 1.9 : 1.6}>
      <path d="M3 10.5 12 3l9 7.5V21h-5.5v-5a3.5 3.5 0 0 0-7 0v5H3Z" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

export function AccountsNavIcon({ active }: { active?: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" {...stroke} strokeWidth={active ? 1.9 : 1.6}>
      <rect x={3} y={5} width={18} height={14} rx={2} fill={active ? 'currentColor' : 'none'} />
      {!active && <path d="M3 10h18" />}
      {active && <path d="M3 10h18" stroke="var(--background)" />}
    </svg>
  )
}

export function PayNavIcon({ active }: { active?: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" {...stroke} strokeWidth={active ? 1.9 : 1.6}>
      <circle cx={12} cy={12} r={9} fill={active ? 'currentColor' : 'none'} />
      <path
        d="M12 7.5v9M14.2 9.5H11a1.6 1.6 0 0 0 0 3.2h2a1.6 1.6 0 0 1 0 3.2H9.5"
        stroke={active ? 'var(--background)' : 'currentColor'}
      />
    </svg>
  )
}

export function RewardsNavIcon({ active }: { active?: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" {...stroke} strokeWidth={active ? 1.9 : 1.6}>
      <path d="M12 3 14.5 9.5 21.5 10.2 16.2 14.8 17.8 21.5 12 18.2 6.2 21.5 7.8 14.8 2.5 10.2 9.5 9.5Z" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

export function ProfileNavIcon({ active }: { active?: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" {...stroke} strokeWidth={active ? 1.9 : 1.6}>
      <circle cx={12} cy={8} r={3.5} fill={active ? 'currentColor' : 'none'} />
      <path d="M5.5 19.5a7.5 5 0 0 1 13 0" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

export function VirginMark({ size = 21, light = true }: { size?: number; light?: boolean }) {
  const color = light ? 'var(--primary-foreground)' : 'var(--brand)'
  return (
    <span className="brand-mark" style={{ fontSize: `${size}px`, color }}>
      <span className="brand-mark__circle" style={{ width: `${size * 1.55}px`, height: `${size * 1.55}px` }}>
        <span className="brand-mark__script">Virgin</span>
      </span>
      <span className="brand-mark__money">money</span>
    </span>
  )
}
