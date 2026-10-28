import { useState } from 'react'
import { BottomNavigation, type NavId } from './components/BottomNavigation'
import { PhoneShell } from './components/PhoneShell'
import { AccountsScreen } from './screens/AccountsScreen'
import { GoAccountScreen } from './screens/GoAccountScreen'
import { HomeScreen } from './screens/HomeScreen'
import { PayIdSheet } from './screens/PayIdSheet'
import { PayScreen } from './screens/PayScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { RewardsScreen } from './screens/RewardsScreen'
import { SplashScreen } from './screens/SplashScreen'

type View = 'splash' | 'tabs' | 'go-account'

export default function App() {
  const [view, setView] = useState<View>('splash')
  const [tab, setTab] = useState<NavId>('home')
  const [payIdOpen, setPayIdOpen] = useState(false)
  const [returnTab, setReturnTab] = useState<NavId>('accounts')

  const openAccount = (from: NavId) => {
    setReturnTab(from)
    setView('go-account')
  }

  const handleNav = (id: NavId) => {
    setTab(id)
    setView('tabs')
  }

  return (
    <PhoneShell>
      {view === 'splash' ? (
        <SplashScreen
          onLogin={() => {
            setTab('home')
            setView('tabs')
          }}
        />
      ) : null}

      {view === 'tabs' ? (
        <>
          {tab === 'home' ? <HomeScreen onOpenAccount={() => openAccount('home')} /> : null}
          {tab === 'accounts' ? <AccountsScreen onOpenAccount={() => openAccount('accounts')} /> : null}
          {tab === 'pay' ? <PayScreen onOpenPayId={() => setPayIdOpen(true)} /> : null}
          {tab === 'rewards' ? <RewardsScreen /> : null}
          {tab === 'profile' ? <ProfileScreen onOpenPayId={() => setPayIdOpen(true)} /> : null}
          <BottomNavigation active={tab} onChange={handleNav} />
        </>
      ) : null}

      {view === 'go-account' ? (
        <GoAccountScreen
          onBack={() => {
            setTab(returnTab)
            setView('tabs')
          }}
        />
      ) : null}

      <PayIdSheet open={payIdOpen} onClose={() => setPayIdOpen(false)} />
    </PhoneShell>
  )
}
