import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Search, BookOpen, ExternalLink, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface InfographicPrompt {
  prompt: string
  width?: number
  height?: number
  seed?: number
}

const defaultTemplates = [
  {
    id: '1',
    title: '代码助手',
    description: '帮助编写、调试和优化代码',
    content: `你是一位专业的编程助手，擅长：
- 编写高质量代码
- 调试和修复bug
- 代码优化和重构
- 解释代码逻辑

请用中文回答所有编程问题。`,
    category: '编程',
  },
  {
    id: '2',
    title: '翻译专家',
    description: '提供高质量的翻译服务',
    content: `你是一位专业的翻译专家，精通多种语言。

请遵循以下规则：
1. 保持原文的语气和风格
2. 确保翻译自然流畅
3. 对于专业术语，保留原文并附上解释
4. 不要直译，要意译

请翻译以下内容：`,
    category: '翻译',
  },
  {
    id: '3',
    title: '文案撰写',
    description: '帮助撰写各类营销文案',
    content: `你是一位经验丰富的营销文案专家。

请根据以下要求撰写文案：
- 标题吸引眼球
- 内容简洁有力
- 突出产品卖点
- 包含明确的行动号召

产品/服务信息：`,
    category: '营销',
  },
]

const categories = ['全部', 'SenseNova 信息图', '通用']

export function Prompts() {
  const [infographicPrompts, setInfographicPrompts] = useState<InfographicPrompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<InfographicPrompt | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')

  useEffect(() => {
    fetch('/data/samples_infographic.jsonl')
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n')
        const prompts = lines.map((line, index) => {
          try {
            return JSON.parse(line) as InfographicPrompt
          } catch {
            return null
          }
        }).filter(Boolean) as InfographicPrompt[]
        setInfographicPrompts(prompts)
        if (prompts.length > 0) {
          setSelectedPrompt(prompts[0])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load infographic prompts:', err)
        setLoading(false)
      })
  }, [])

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const filteredPrompts = infographicPrompts.filter(p =>
    p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto space-y-6 pr-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prompt 模板市场</h1>
        <p className="text-text-secondary mt-1">
          精选高质量 Prompt 模板，一键复制使用
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* SenseNova Infographic Section */}
      {selectedCategory === '全部' || selectedCategory === 'SenseNova 信息图' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">SenseNova 信息图 Prompt</h2>
            <a
              href="https://github.com/OpenSenseNova/SenseNova-U1/blob/main/examples/t2i/data/samples_infographic.jsonl"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-accent hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              查看来源
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Prompt List */}
            <Card className="max-h-[600px] overflow-hidden flex flex-col">
              <CardHeader className="pb-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    placeholder="搜索 prompt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="text-xs text-text-muted mt-2">
                  共 {filteredPrompts.length} 个模板
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-surface-elevated rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPrompts.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedPrompt(item)}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-colors",
                          selectedPrompt === item
                            ? "bg-accent/10 border border-accent/50"
                            : "bg-surface-elevated hover:bg-surface-elevated/80"
                        )}
                      >
                        <p className="text-sm line-clamp-2">
                          {item.prompt.slice(0, 150)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                          {item.width && item.height && (
                            <span>{item.width} x {item.height}</span>
                          )}
                          {item.seed && <span>Seed: {item.seed}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt Detail */}
            <Card className="max-h-[600px] overflow-hidden flex flex-col">
              <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Prompt 详情</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectedPrompt && handleCopy(selectedPrompt.prompt, 'selected')}
                    disabled={!selectedPrompt}
                  >
                    <Copy className={cn("w-4 h-4 mr-1", copiedId === 'selected' && "text-success")} />
                    复制
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {selectedPrompt ? (
                  <div className="bg-surface-elevated rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {selectedPrompt.prompt}
                    </pre>
                    {selectedPrompt.width && selectedPrompt.height && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Label className="text-xs text-text-muted">推荐尺寸</Label>
                        <p className="text-sm mt-1">
                          {selectedPrompt.width} x {selectedPrompt.height}
                        </p>
                      </div>
                    )}
                    {selectedPrompt.seed && (
                      <div className="mt-3">
                        <Label className="text-xs text-text-muted">Seed</Label>
                        <p className="text-sm font-mono">{selectedPrompt.seed}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted">
                    选择一个 Prompt 查看详情
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* General Templates Section */}
      {selectedCategory === '全部' || selectedCategory === '通用' ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            通用模板
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {defaultTemplates.map((template) => (
              <Card
                key={template.id}
                className="group hover:border-accent/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {template.category}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(template.content, template.id)}
                    >
                      <Copy className={cn(
                        "w-4 h-4",
                        copiedId === template.id && "text-success"
                      )} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                    {template.description}
                  </p>
                  <div className="bg-surface-elevated rounded-lg p-3 text-xs text-text-muted font-mono line-clamp-4">
                    {template.content}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-3 p-0 h-auto text-accent"
                    onClick={() => handleCopy(template.content, template.id)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    复制 Prompt
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
