import type { ComponentType } from 'react'
import {
  AccountsNavIcon,
  HomeNavIcon,
  PayNavIcon,
  ProfileNavIcon,
  RewardsNavIcon,
} from './icons'

export type NavId = 'home' | 'accounts' | 'pay' | 'rewards' | 'profile'

const items: Array<{ id: NavId; label: string; Icon: ComponentType<{ active?: boolean }> }> = [
  { id: 'home', label: 'Home', Icon: HomeNavIcon },
  { id: 'accounts', label: 'Accounts', Icon: AccountsNavIcon },
  { id: 'pay', label: 'Pay', Icon: PayNavIcon },
  { id: 'rewards', label: 'Rewards', Icon: RewardsNavIcon },
  { id: 'profile', label: 'Profile', Icon: ProfileNavIcon },
]

interface BottomNavigationProps {
  active: NavId
  onChange: (id: NavId) => void
}

export function BottomNavigation({ active, onChange }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            className={`bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon active={isActive} />
            <span className="bottom-nav__label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
