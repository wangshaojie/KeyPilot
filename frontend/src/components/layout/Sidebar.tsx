import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Key,
  MessageSquare,
  Gauge,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/keys', label: 'API 密钥', icon: Key },
  { path: '/chat', label: '对话', icon: MessageSquare },
  { path: '/speed-test', label: '速度测试', icon: Gauge },
  { path: '/statistics', label: '统计', icon: BarChart3 },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 bottom-8 border-r border-border bg-surface transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-accent/10 text-accent border-l-2 border-accent"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="rounded-lg bg-accent/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Quick Stats</span>
              </div>
              <div className="space-y-1 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Active Keys</span>
                  <span className="text-text-primary">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Today's Usage</span>
                  <span className="text-text-primary">$0.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
