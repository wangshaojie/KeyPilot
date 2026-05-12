import { BarChart3, TrendingUp, Download, Key, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useKeyStore } from '@/stores/useKeyStore'
import { PROVIDERS, type ProviderId } from '@/lib/constants'
import { formatCurrency, formatNumber } from '@/lib/utils'

// Simple chart components using divs (no external chart library needed)
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let accumulatedPercent = 0

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {data.map((item, i) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0
          const startPercent = accumulatedPercent
          accumulatedPercent += percent

          const startX = 50 + 40 * Math.cos((2 * Math.PI * startPercent) / 100)
          const startY = 50 + 40 * Math.sin((2 * Math.PI * startPercent) / 100)
          const endX = 50 + 40 * Math.cos((2 * Math.PI * (startPercent + percent)) / 100)
          const endY = 50 + 40 * Math.sin((2 * Math.PI * (startPercent + percent)) / 100)
          const largeArc = percent > 50 ? 1 : 0

          return (
            <path
              key={i}
              d={`M ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY}`}
              fill="none"
              stroke={item.color}
              strokeWidth="20"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold">{formatCurrency(total)}</p>
          <p className="text-xs text-text-muted">总计</p>
        </div>
      </div>
    </div>
  )
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="font-medium">{formatCurrency(item.value)}</span>
          </div>
          <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Statistics() {
  const { keys } = useKeyStore()

  // Calculate usage by provider
  const usageByProvider = keys.reduce((acc, key) => {
    const provider = PROVIDERS[key.provider as ProviderId]
    const name = provider?.name || key.provider
    acc[name] = (acc[name] || 0) + (key.usageCost || 0)
    return acc
  }, {} as Record<string, number>)

  const providerChartData = Object.entries(usageByProvider).map(([label, value], i) => ({
    label,
    value,
    color: Object.values(PROVIDERS)[i % Object.values(PROVIDERS).length]?.color || '#71717a',
  }))

  const totalUsage = keys.reduce((s, k) => s + (k.usageCost || 0), 0)
  const totalRequests = keys.reduce((s, k) => s + (k.usageCount || 0), 0)
  const activeKeys = keys.filter((k) => k.enabled).length

  const topKeys = [...keys]
    .filter((k) => k.usageCost > 0)
    .sort((a, b) => (b.usageCost || 0) - (a.usageCost || 0))
    .slice(0, 5)

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      summary: {
        totalUsage,
        totalRequests,
        activeKeys,
        keyCount: keys.length,
      },
      keys: keys.map((k) => ({
        name: k.name,
        provider: k.provider,
        usageCost: k.usageCost,
        usageCount: k.usageCount,
      })),
      usageByProvider,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keypilot-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">统计</h1>
          <p className="text-text-secondary mt-1">
            追踪你的 AI 使用情况和费用
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          导出数据
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">总消耗</p>
                <p className="text-2xl font-semibold mt-1">{formatCurrency(totalUsage)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">总请求数</p>
                <p className="text-2xl font-semibold mt-1">{formatNumber(totalRequests)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">活跃密钥</p>
                <p className="text-2xl font-semibold mt-1">{activeKeys}</p>
              </div>
              <Zap className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">平均成本/密钥</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(keys.length > 0 ? totalUsage / keys.length : 0)}
                </p>
              </div>
              <Key className="w-8 h-8 text-text-muted" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Provider */}
        <Card>
          <CardHeader>
            <CardTitle>按服务商的使用情况</CardTitle>
          </CardHeader>
          <CardContent>
            {providerChartData.length > 0 ? (
              <>
                <DonutChart data={providerChartData} />
                <div className="mt-6 space-y-2">
                  {providerChartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-text-muted">
暂无使用数据。开始使用你的密钥来查看统计数据。
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Keys by Usage */}
        <Card>
          <CardHeader>
            <CardTitle>使用量最高的密钥</CardTitle>
          </CardHeader>
          <CardContent>
            {topKeys.length > 0 ? (
              <BarChart
                data={topKeys.map((key) => {
                  const provider = PROVIDERS[key.provider as ProviderId]
                  return {
                    label: key.name,
                    value: key.usageCost || 0,
                    color: provider?.color || '#71717a',
                  }
                })}
              />
            ) : (
              <div className="text-center py-8 text-text-muted">
暂无使用数据。开始使用你的密钥来查看统计数据。
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>所有密钥</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm">
                  <th className="pb-3 font-medium">名称</th>
                  <th className="pb-3 font-medium">服务商</th>
                  <th className="pb-3 font-medium text-right">请求数</th>
                  <th className="pb-3 font-medium text-right">消耗</th>
                  <th className="pb-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => {
                  const provider = PROVIDERS[key.provider as ProviderId]
                  return (
                    <tr key={key.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{key.name}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: provider?.color }}
                          />
                          {provider?.name || key.provider}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono">
                        {formatNumber(key.usageCount || 0)}
                      </td>
                      <td className="py-3 text-right font-mono">
                        {formatCurrency(key.usageCost || 0)}
                      </td>
                      <td className="py-3">
                        <Badge variant={key.enabled ? 'success' : 'secondary'}>
                          {key.enabled ? '启用' : '禁用'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
