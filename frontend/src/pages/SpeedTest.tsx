import { Zap, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKeyStore } from '@/stores/useKeyStore'
import { PROVIDERS, type ProviderId } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function SpeedTest() {
  const { keys, testingKeys, speedTestResults, testKey, testAllKeys } = useKeyStore()

  const activeKeys = keys.filter((k) => k.enabled)

  const handleTestAll = async () => {
    await testAllKeys()
  }

  const getResultForKey = (keyId: string) => {
    return speedTestResults.find((r) => r.keyId === keyId)
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 500) return 'text-success'
    if (latency < 1000) return 'text-yellow-500'
    return 'text-error'
  }

  const getLatencyBar = (latency: number, maxLatency: number) => {
    return (latency / maxLatency) * 100
  }

  const maxLatency = Math.max(...speedTestResults.map((r) => r.latency), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">速度测试</h1>
          <p className="text-text-secondary mt-1">
            测试你的 API 密钥的延迟和吞吐量
          </p>
        </div>
        <Button onClick={handleTestAll} disabled={activeKeys.length === 0 || testingKeys.size > 0}>
          <RefreshCw className={cn('w-4 h-4 mr-2', testingKeys.size > 0 && 'animate-spin')} />
          测试全部密钥
        </Button>
      </div>

      {keys.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="w-16 h-16 rounded-full bg-surface-elevated mx-auto mb-4 flex items-center justify-center">
              <Zap className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-medium mb-2">没有可测试的密钥</h3>
            <p className="text-text-secondary mb-4">
              先添加一些 API 密钥来运行速度测试。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">平均延迟</p>
                    <p className="text-2xl font-semibold mt-1">
                      {speedTestResults.length > 0
                        ? `${Math.round(speedTestResults.reduce((s, r) => s + r.latency, 0) / speedTestResults.length)}ms`
                        : '--'}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-text-muted" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">成功测试</p>
                    <p className="text-2xl font-semibold mt-1">
                      {speedTestResults.filter((r) => r.status === 'success').length} / {speedTestResults.length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">最快密钥</p>
                    <p className="text-2xl font-semibold mt-1 truncate">
                      {speedTestResults.length > 0
                        ? keys.find((k) => k.id === speedTestResults.sort((a, b) => a.latency - b.latency)[0]?.keyId)?.name || '--'
                        : '--'}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Chart */}
          {speedTestResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>延迟对比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {speedTestResults
                    .filter((r) => r.status === 'success')
                    .sort((a, b) => a.latency - b.latency)
                    .map((result) => {
                      const key = keys.find((k) => k.id === result.keyId)
                      const provider = PROVIDERS[key?.provider as ProviderId]

                      return (
                        <div key={result.keyId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: provider?.color }}
                              />
                              <span className="font-medium">{key?.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {provider?.name}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={cn('font-mono font-medium', getLatencyColor(result.latency))}>
                                {result.latency}ms
                              </span>
                              {result.ttft && (
                                <span className="text-text-muted text-xs">
                                  TTFT: {result.ttft}ms
                                </span>
                              )}
                              {result.tps && (
                                <span className="text-text-muted text-xs">
                                  TPS: {result.tps}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="relative h-2 bg-surface-elevated rounded-full overflow-hidden">
                            <div
                              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${getLatencyBar(result.latency, maxLatency)}%`,
                                backgroundColor:
                                  result.latency < 500
                                    ? '#22c55e'
                                    : result.latency < 1000
                                    ? '#eab308'
                                    : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Key Cards */}
          <div className="grid gap-4">
            {keys.map((key) => {
              const provider = PROVIDERS[key.provider as ProviderId]
              const result = getResultForKey(key.id)
              const isTesting = testingKeys.has(key.id)

              return (
                <Card key={key.id} className={cn(!key.enabled && 'opacity-60')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: provider?.color || '#71717a' }}
                        >
                          {provider?.name.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{key.name}</h3>
                            <Badge variant={key.enabled ? 'success' : 'secondary'}>
                              {key.enabled ? '启用' : '禁用'}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-muted">
                            {provider?.name} • {key.key.slice(0, 8)}...
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {result && (
                          <div className="text-right hidden md:block">
                            <div className="flex items-center gap-2">
                              {result.status === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-success" />
                              ) : (
                                <XCircle className="w-4 h-4 text-error" />
                              )}
                              <span
                                className={cn(
                                  'font-mono font-semibold',
                                  result.status === 'success' && getLatencyColor(result.latency)
                                )}
                              >
                                {result.status === 'success' ? `${result.latency}ms` : result.error}
                              </span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                              {result.status === 'success'
                                ? `${result.ttft || 0}ms TTFT • ${result.tps || 0} TPS`
                                : '测试失败'}
                            </p>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testKey(key.id)}
                          disabled={!key.enabled || isTesting}
                        >
                          {isTesting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              测试
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
