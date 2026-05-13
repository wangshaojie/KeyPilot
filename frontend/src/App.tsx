import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Keys } from './pages/Keys'
import { Chat } from './pages/Chat'
import { Prompts } from './pages/Prompts'
import { SpeedTest } from './pages/SpeedTest'
import { Statistics } from './pages/Statistics'
import { Settings } from './pages/Settings'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/keys" element={<Keys />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/speed-test" element={<SpeedTest />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}

export default App
