import { Link } from 'react-router-dom'
import { Moon, Sun, Settings, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function Header() {
  const { theme, setTheme } = useSettingsStore()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">KeyPilot</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          <Link to="/settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
