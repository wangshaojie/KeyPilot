import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Zap, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useKeyStore } from '@/stores/useKeyStore'
import { PROVIDERS, CHAT_MODELS, IMAGE_MODELS, VIDEO_MODELS, AUDIO_MODELS, MUSIC_MODELS, type ProviderId } from '@/lib/constants'
import { cn, formatDate, truncateKey } from '@/lib/utils'
import { toast } from 'sonner'

export function Keys() {
  const { keys, testingKeys, addKey, updateKey, deleteKey, testKey, testAllKeys } = useKeyStore()
  const [search, setSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({})

  const [formData, setFormData] = useState({
    provider: 'openai' as ProviderId,
    name: '',
    key: '',
    baseUrl: '',
    models: [] as string[],
    modelInput: '',
    enabled: true,
  })

  const filteredKeys = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.provider.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddKey = async () => {
    if (!formData.name || !formData.key) {
      toast.error('请填写所有必填项')
      return
    }
    await addKey({
      provider: formData.provider,
      name: formData.name,
      key: formData.key,
      baseUrl: formData.baseUrl || undefined,
      models: formData.models.length > 0 ? formData.models : undefined,
      enabled: formData.enabled,
    })
    setShowAddDialog(false)
    setFormData({ provider: 'openai', name: '', key: '', baseUrl: '', models: [], modelInput: '', enabled: true })
    toast.success('API key added successfully')
  }

  const handleUpdateKey = async () => {
    if (!editingKey || !formData.name || !formData.key) {
      toast.error('请填写所有必填项')
      return
    }
    await updateKey(editingKey, {
      provider: formData.provider,
      name: formData.name,
      key: formData.key,
      baseUrl: formData.baseUrl || undefined,
      models: formData.models.length > 0 ? formData.models : undefined,
      enabled: formData.enabled,
    })
    setEditingKey(null)
    setFormData({ provider: 'openai', name: '', key: '', baseUrl: '', models: [], modelInput: '', enabled: true })
    toast.success('API key updated successfully')
  }

  const handleDeleteKey = async () => {
    if (!deletingKey) return
    await deleteKey(deletingKey)
    setDeletingKey(null)
    toast.success('API key deleted')
  }

  const handleToggleKey = async (id: string, enabled: boolean) => {
    await updateKey(id, { enabled })
    toast.success(`Key ${enabled ? 'enabled' : 'disabled'}`)
  }

  const handleAddModel = () => {
    if (formData.modelInput.trim()) {
      setFormData({
        ...formData,
        models: [...formData.models, formData.modelInput.trim()],
        modelInput: '',
      })
    }
  }

  const handleRemoveModel = (index: number) => {
    setFormData({
      ...formData,
      models: formData.models.filter((_, i) => i !== index),
    })
  }

  // Get all models for the selected provider
  const getModelsForProvider = (providerId: string) => {
    const allModels = [...CHAT_MODELS, ...IMAGE_MODELS, ...VIDEO_MODELS, ...AUDIO_MODELS, ...MUSIC_MODELS]
    return allModels.filter(m => m.provider === providerId)
  }

  const handleProviderChange = (newProvider: ProviderId) => {
    // Get models for new provider and pre-select all by default
    const providerModels = getModelsForProvider(newProvider)
    const modelIds = providerModels.map(m => m.id)
    setFormData({
      ...formData,
      provider: newProvider,
      models: modelIds,
      baseUrl: PROVIDERS[newProvider]?.baseUrl || '',
    })
  }

  const toggleModel = (modelId: string) => {
    if (formData.models.includes(modelId)) {
      setFormData({
        ...formData,
        models: formData.models.filter(m => m !== modelId),
      })
    } else {
      setFormData({
        ...formData,
        models: [...formData.models, modelId],
      })
    }
  }

  const selectAllModels = () => {
    const providerModels = getModelsForProvider(formData.provider)
    setFormData({
      ...formData,
      models: providerModels.map(m => m.id),
    })
  }

  const deselectAllModels = () => {
    setFormData({
      ...formData,
      models: [],
    })
  }

  const handleTestKey = async (id: string) => {
    await testKey(id)
    toast.success('Speed test completed')
  }

  const openEditDialog = (key: typeof keys[0]) => {
    // Get current models or default to all models for this provider
    const currentModels = key.models && key.models.length > 0
      ? key.models
      : getModelsForProvider(key.provider).map(m => m.id)

    setFormData({
      provider: key.provider as ProviderId,
      name: key.name,
      key: key.key,
      baseUrl: key.baseUrl || '',
      models: currentModels,
      modelInput: '',
      enabled: key.enabled,
    })
    setEditingKey(key.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">API 密钥</h1>
          <p className="text-text-secondary mt-1">
            Manage your AI provider API keys
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => testAllKeys()} disabled={keys.length === 0}>
            <Zap className="w-4 h-4 mr-2" />
            测试全部
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Key
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="搜索密钥..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Keys Grid */}
      {keys.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="w-16 h-16 rounded-full bg-surface-elevated mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
            <p className="text-text-secondary mb-4 max-w-md mx-auto">
              Add your first AI provider API key to start managing and testing your keys in one place.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredKeys.map((key) => {
            const provider = PROVIDERS[key.provider as ProviderId]
            const isTesting = testingKeys.has(key.id)

            return (
              <Card key={key.id} className="hover:border-accent/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: provider?.color || '#71717a' }}
                      >
                        {provider?.name.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{key.name}</h3>
                          <Badge variant={key.enabled ? 'success' : 'secondary'}>
                            {key.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted">
                          {provider?.name || key.provider} • {truncateKey(key.key)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium">${key.usageCost?.toFixed(2) || '0.00'}</p>
                        <p className="text-xs text-text-muted">{key.usageCount} requests</p>
                      </div>

                      <div className="text-right hidden lg:block">
                        <p className="text-sm text-text-secondary">
                          {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never used'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={key.enabled}
                          onCheckedChange={(checked) => handleToggleKey(key.id, checked)}
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTestKey(key.id)}
                          disabled={isTesting || !key.enabled}
                        >
                          <Zap className={cn('w-4 h-4', isTesting && 'animate-pulse')} />
                        </Button>

                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(key)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingKey(key.id)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingKey} onOpenChange={() => {
        setShowAddDialog(false)
        setEditingKey(null)
        setFormData({ provider: 'openai', name: '', key: '', baseUrl: '', models: [], modelInput: '', enabled: true })
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingKey ? '编辑 API 密钥' : '添加新 API 密钥'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>服务商</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => handleProviderChange(value as ProviderId)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PROVIDERS).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              label="名称"
              placeholder="我的 API 密钥"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div className="space-y-2">
              <Label>API 密钥</Label>
              <div className="relative">
                <Input
                  type={showKeyMap[formData.key] ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowKeyMap((prev) => ({ ...prev, [formData.key]: !prev[formData.key] }))}
                >
                  {showKeyMap[formData.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Base URL for all providers except those with built-in defaults */}
            {!['openai', 'anthropic', 'google'].includes(formData.provider) && (
              <Input
                label="自定义地址 (可选)"
                placeholder={formData.provider === 'custom' ? 'https://api.example.com/v1' : '留空使用提供商默认'}
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                helperText={formData.provider === 'custom' ? 'Custom endpoint' : 'Override default API endpoint'}
              />
            )}

            {/* Models - show all models for selected provider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>模型</Label>
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={selectAllModels} className="text-accent hover:underline">
                    全选
                  </button>
                  <span className="text-text-muted">|</span>
                  <button type="button" onClick={deselectAllModels} className="text-accent hover:underline">
                    取消全选
                  </button>
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {getModelsForProvider(formData.provider).length === 0 ? (
                  <p className="text-sm text-text-muted">该供应商暂无预定义模型</p>
                ) : (
                  getModelsForProvider(formData.provider).map((model) => (
                    <label key={model.id} className="flex items-center gap-2 cursor-pointer hover:bg-surface-elevated p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.models.includes(model.id)}
                        onChange={() => toggleModel(model.id)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                      <span className="text-sm">{model.name}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {model.type}
                      </Badge>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-text-muted">
                已选择 {formData.models.length} 个模型
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable this key</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingKey(null)
            }}>
              取消
            </Button>
            <Button onClick={editingKey ? handleUpdateKey : handleAddKey}>
              {editingKey ? '保存修改' : '添加密钥'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingKey} onOpenChange={() => setDeletingKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除 API 密钥</DialogTitle>
          </DialogHeader>
          <p className="text-text-secondary">
            Are you sure you want to delete this API key? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingKey(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
