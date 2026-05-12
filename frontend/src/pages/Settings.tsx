import { useState } from 'react'
import { Moon, Sun, Monitor, Download, Upload, Trash2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function Settings() {
  const { theme, baseUrl, setTheme, updateSettings } = useSettingsStore()
  const [proxyUrl, setProxyUrl] = useState(baseUrl || '')
  const [saving, setSaving] = useState(false)

  const handleSaveProxy = async () => {
    setSaving(true)
    try {
      await updateSettings({ baseUrl: proxyUrl || undefined })
      toast.success('设置已保存')
    } catch (error) {
      toast.error('保存设置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      settings: { theme, baseUrl },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keypilot-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('设置已导出')
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            if (data.settings) {
              setProxyUrl(data.settings.baseUrl || '')
              if (data.settings.theme) {
                setTheme(data.settings.theme)
              }
              toast.success('设置已导入')
            }
          } catch {
            toast.error('无效的设置文件')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleClearData = () => {
    if (confirm('确定要清除所有本地数据吗？这将删除你所有的密钥、对话和设置。')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">设置</h1>
        <p className="text-text-secondary mt-1">
          自定义你的 KeyPilot 体验
        </p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>外观</CardTitle>
          <CardDescription>选择你喜欢的颜色主题</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex-1 p-4 rounded-xl border-2 transition-all',
                theme === 'light'
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              )}
            >
              <Sun className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">浅色</p>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex-1 p-4 rounded-xl border-2 transition-all',
                theme === 'dark'
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              )}
            >
              <Moon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">深色</p>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={cn(
                'flex-1 p-4 rounded-xl border-2 transition-all',
                theme === 'system'
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              )}
            >
              <Monitor className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">跟随系统</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Proxy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>代理配置</CardTitle>
          <CardDescription>
            可选的 API 请求代理地址。留空则使用直连。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>基础地址</Label>
            <Input
              placeholder="https://your-proxy.com/v1"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              helperText="所有 API 请求都将通过此代理路由"
            />
          </div>
          <Button onClick={handleSaveProxy} disabled={saving}>
            {saving ? '保存中...' : '保存更改'}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>数据管理</CardTitle>
          <CardDescription>导出、导入或清除你的数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              导出设置
            </Button>
            <Button variant="outline" onClick={handleImportData}>
              <Upload className="w-4 h-4 mr-2" />
              导入设置
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">清除所有数据</p>
              <p className="text-sm text-text-muted">永久删除所有本地数据</p>
            </div>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="w-4 h-4 mr-2" />
              清除数据
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>关于 KeyPilot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div>
              <h3 className="font-semibold">KeyPilot v1.0.0</h3>
              <p className="text-sm text-text-secondary mt-1">
                一个开源、轻量级、本地部署的 AI 密钥管理平台。
              </p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <p className="text-text-secondary">
              KeyPilot 帮助你在一个地方管理来自多个 AI 提供商的 API 密钥。
              所有数据都存储在本地 —— 你的密钥永远不会离开你的设备。
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                GitHub
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                文档
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
