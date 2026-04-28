import { useState } from 'react'
import { AppShell } from './components/AppShell'
import { TopNav } from './components/TopNav'
import { AttentionsScreen } from './screens/AttentionsScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { OutreachesScreen } from './screens/OutreachesScreen'
import { PatientsScreen } from './screens/PatientsScreen'
import { ReportsScreen } from './screens/ReportsScreen'
import type { Screen } from './types'

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('Inicio')

  return (
    <AppShell>
      <TopNav
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
      />
      <main
        className="app-page mx-auto w-full max-w-[1260px] px-3.5 pb-8 pt-[18px] sm:px-[34px] sm:pb-11 sm:pt-6"
        key={activeScreen}
      >
        {renderScreen(activeScreen)}
      </main>
    </AppShell>
  )
}

function renderScreen(activeScreen: Screen) {
  switch (activeScreen) {
    case 'Operativos':
      return <OutreachesScreen />
    case 'Pacientes':
      return <PatientsScreen />
    case 'Atenciones':
      return <AttentionsScreen />
    case 'Reportes':
      return <ReportsScreen />
    case 'Inicio':
    default:
      return <DashboardScreen />
  }
}

export default App
