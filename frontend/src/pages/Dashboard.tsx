import { Link } from 'react-router-dom'
import {
  Key,
  MessageSquare,
  Gauge,
  TrendingUp,
  Zap,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKeyStore } from '@/stores/useKeyStore'
import { useChatStore } from '@/stores/useChatStore'

export function Dashboard() {
  const { keys } = useKeyStore()
  const { conversations } = useChatStore()

  const activeKeys = keys.filter((k) => k.enabled)
  const totalUsage = keys.reduce((sum, k) => sum + (k.usageCost || 0), 0)

  const stats = [
    {
      label: '密钥总数',
      value: keys.length,
      icon: Key,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: '活跃密钥',
      value: activeKeys.length,
      icon: Zap,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: '对话数',
      value: conversations.length,
      icon: MessageSquare,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: '总消耗',
      value: `$${totalUsage.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
  ]

  const quickActions = [
    { label: '添加密钥', icon: Plus, path: '/keys', variant: 'default' as const },
    { label: '开始对话', icon: MessageSquare, path: '/chat', variant: 'outline' as const },
    { label: '速度测试', icon: Gauge, path: '/speed-test', variant: 'outline' as const },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">仪表盘</h1>
          <p className="text-text-secondary mt-1">
            管理你的 AI 密钥并查看使用情况
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:border-accent/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{stat.label}</p>
                  <p className="text-3xl font-semibold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <Card className="hover:border-accent/30 transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center">
                      <action.icon className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Keys */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>最近的密钥</CardTitle>
            <Link to="/keys">
              <Button variant="ghost" size="sm">
                查看全部
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">暂无密钥</p>
                <Link to="/keys">
                  <Button className="mt-4" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    添加你的第一个密钥
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.slice(0, 5).map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          key.enabled ? 'bg-success' : 'bg-text-muted'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">{key.name}</p>
                        <p className="text-xs text-text-muted">{key.provider}</p>
                      </div>
                    </div>
                    <Badge variant={key.enabled ? 'success' : 'secondary'}>
                      {key.enabled ? '启用' : '禁用'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>最近的对话</CardTitle>
            <Link to="/chat">
              <Button variant="ghost" size="sm">
                查看全部
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">暂无对话</p>
                <Link to="/chat">
                  <Button className="mt-4" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    开始对话
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 5).map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {conv.title || '新对话'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {conv.messages.length} 条消息
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
