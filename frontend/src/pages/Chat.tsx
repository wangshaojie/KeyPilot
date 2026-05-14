import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
import {
  Send,
  Trash2,
  Plus,
  MessageSquare,
  Copy,
  CheckCheck,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import { useKeyStore } from "@/stores/useKeyStore";
import {
  CHAT_MODELS,
  IMAGE_MODELS,
  VIDEO_MODELS,
  AUDIO_MODELS,
  MUSIC_MODELS,
  PROVIDERS,
  type ProviderId,
} from "@/lib/constants";
import { cn, formatDate, copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const MarkdownContent = memo(function MarkdownContent({
  content,
}: {
  content: string;
}) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p className="mb-4 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return (
              <ul className="list-disc list-inside mb-4 space-y-1">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-inside mb-4 space-y-1">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="text-inherit">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-accent/50 pl-4 italic text-inherit mb-4">
                {children}
              </blockquote>
            );
          },
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code
                  className="bg-surface-elevated px-1.5 py-0.5 rounded text-accent font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="not-prose mb-4 rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  style={oneDark}
                  language={match ? match[1] : "text"}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    background: "transparent",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          },
          pre({ children }) {
            return (
              <pre className="mb-4 rounded-lg overflow-hidden">{children}</pre>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            if (!src) return null;
            return (
              <img
                src={src}
                alt={alt || "Generated image"}
                className="max-w-full h-auto rounded-lg my-3 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: "600px", objectFit: "contain" }}
                onClick={() => window.open(src, "_blank")}
              />
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse mb-4 text-sm">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-border bg-surface-elevated px-3 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-border px-3 py-2">{children}</td>
            );
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-4">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mb-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold mb-2">{children}</h3>;
          },
          hr() {
            return <hr className="border-border my-6" />;
          },
          strong({ children }) {
            return <strong className="font-semibold">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

// Check if content is a direct image URL (not markdown syntax)
function isImageUrl(content: string): boolean {
  if (!content) return false;
  // Check if it's a direct URL to an image
  return /^(https?:\/\/|\/\/).+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(
    content,
  );
}

const MessageItem = memo(function MessageItem({
  message,
  onCopy,
  copiedId,
}: {
  message: any;
  onCopy: (content: string, id: string) => void;
  copiedId: string | null;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex flex-col gap-2 w-full",
        isUser ? "items-end" : "items-stretch",
      )}
    >
      <div className="flex items-center gap-2">
        {isUser && (
          <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center">
            <span className="text-xs font-semibold">U</span>
          </div>
        )}
        <span className="text-xs text-text-muted">
          {formatDate(message.timestamp)}
          {message.tokens && ` • ${message.tokens} tokens`}
        </span>
        {!isUser && (
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-accent">AI</span>
          </div>
        )}
      </div>
      <div
        className={cn(
          "max-w-6xl rounded-2xl px-4 py-3 relative group",
          isUser ? "bg-accent/15 text-accent" : "bg-surface-elevated",
        )}
      >
        <div className="text-sm">
          {message.isLoading ? (
            // Loading state - show skeleton placeholder
            <div className="space-y-2">
              {message.generationType === "image" && (
                <div className="w-64 h-64 bg-surface-elevated rounded-lg animate-pulse flex items-center justify-center">
                  <span className="text-text-muted text-sm">生成图片中...</span>
                </div>
              )}
              {message.generationType === "video" && (
                <div className="w-64 h-40 bg-surface-elevated rounded-lg animate-pulse flex items-center justify-center">
                  <span className="text-text-muted text-sm">生成视频中...</span>
                </div>
              )}
              {message.generationType === "audio" && (
                <div className="w-48 h-12 bg-surface-elevated rounded-lg animate-pulse flex items-center justify-center">
                  <span className="text-text-muted text-sm">合成语音中...</span>
                </div>
              )}
              {message.generationType === "music" && (
                <div className="w-48 h-12 bg-surface-elevated rounded-lg animate-pulse flex items-center justify-center">
                  <span className="text-text-muted text-sm">生成音乐中...</span>
                </div>
              )}
              <p className="text-xs text-text-muted italic truncate">
                {message.prompt}
              </p>
            </div>
          ) : message.isError ? (
            // Error state
            <span className="text-error">{message.content}</span>
          ) : message.generationType === "image" &&
            isImageUrl(message.content) ? (
            <img
              src={message.content}
              alt="Generated image"
              className="max-w-full h-auto rounded-lg my-2 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: "600px", objectFit: "contain" }}
              onClick={() => setLightboxImage(message.content)}
            />
          ) : message.generationType === "image" && message.content ? (
            <img
              src={message.content}
              alt="Generated image"
              className="max-w-full h-auto rounded-lg my-2 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: "600px", objectFit: "contain" }}
              onClick={() => setLightboxImage(message.content)}
            />
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
          )}
          onClick={() => onCopy(message.content, message.id)}
        >
          {copiedId === message.id ? (
            <CheckCheck className="w-3 h-3 text-accent" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
});

// Optimized streaming message - parses Markdown incrementally without layout shift
const StreamingMessage = memo(function StreamingMessage() {
  const content = useChatStore((s) => s.streamingContent);
  const streamingRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming
  useEffect(() => {
    if (streamingRef.current) {
      streamingRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [content]);

  // For streaming, render as plain text first to avoid lag from incomplete markdown
  const displayContent = content || "...";

  return (
    <div className="flex flex-col gap-2 items-start">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-xs font-semibold text-accent">AI</span>
        </div>
        <span className="text-xs text-text-muted">流式输出中...</span>
      </div>
      <div
        ref={containerRef}
        className="bg-surface-elevated rounded-2xl px-4 py-3 max-w-3xl"
      >
        <div className="text-sm whitespace-pre-wrap wrap-break-word">
          {displayContent}
          <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
        </div>
        <div ref={streamingRef} />
      </div>
    </div>
  );
});

export function Chat() {
  // Use selectors to avoid unnecessary re-renders when streamingContent changes
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const messages = useChatStore((s) => s.messages);
  const streaming = useChatStore((s) => s.streaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const createConversation = useChatStore((s) => s.createConversation);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const addMessages = useChatStore((s) => s.addMessages);
  const updateMessage = useChatStore((s) => s.updateMessage);

  // Note: streamingContent is now subscribed inside StreamingMessage component
  // to avoid triggering Chat component re-renders during streaming

  const { keys } = useKeyStore();

  const [input, setInput] = useState("");
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<string>("2048x2048");
  const [imageNum, setImageNum] = useState<number>(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastConversationIdRef = useRef<string | null>(activeConversationId);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const activeKeys = useMemo(() => keys.filter((k) => k.enabled), [keys]);

  // Scroll to bottom function - uses scrollIntoView for reliable scrolling
  const scrollToBottom = useCallback(() => {
    // First try using messagesEndRef with scrollIntoView
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    } else if (messagesContainerRef.current) {
      // Fallback: Find the nearest scrollable parent and scroll to bottom
      let scrollContainer = messagesContainerRef.current.parentElement;
      while (scrollContainer) {
        const style = window.getComputedStyle(scrollContainer);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          break;
        }
        scrollContainer = scrollContainer.parentElement;
      }

      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer!.scrollTop = scrollContainer!.scrollHeight;
        });
      }
    }
  }, []);

  // Fetch conversations from backend on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Restore active conversation's messages when activeConversationId is restored from persistence
  useEffect(() => {
    if (activeConversationId) {
      selectConversation(activeConversationId);
    }
  }, []); // Only run once on mount to restore from persistence

  // Auto-select first key only on mount when no key is selected
  useEffect(() => {
    if (activeKeys.length > 0 && !selectedKeyId) {
      setSelectedKeyId(activeKeys[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Track the previous selectedKeyId to avoid unnecessary resets
  const prevSelectedKeyIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedKeyId) return;

    // Only reset model when switching to a DIFFERENT key
    if (prevSelectedKeyIdRef.current === selectedKeyId) {
      // Same key, don't reset the model
      return;
    }
    prevSelectedKeyIdRef.current = selectedKeyId;

    const key = keys.find((k) => k.id === selectedKeyId);
    if (!key) return;

    if (generationType) {
      // Generation mode - select first model of the generation type
      if (key.provider === "custom" && key.models && key.models.length > 0) {
        setSelectedModel(key.models[0]);
      } else {
        const providerModels =
          PROVIDERS[key.provider as keyof typeof PROVIDERS]?.models || [];
        const genModels = providerModels.filter(
          (m: any) => m.type === generationType,
        );
        if (genModels.length > 0) {
          setSelectedModel(genModels[0].id);
        }
      }
    } else {
      // Chat mode - select first chat model only if current model doesn't match provider
      if (key.provider === "custom" && key.models && key.models.length > 0) {
        if (!key.models.includes(selectedModel)) {
          setSelectedModel(key.models[0]);
        }
      } else {
        const allModelsForProvider = [
          ...CHAT_MODELS.filter((m) => m.provider === key.provider),
          ...IMAGE_MODELS.filter((m) => m.provider === key.provider),
          ...VIDEO_MODELS.filter((m) => m.provider === key.provider),
          ...AUDIO_MODELS.filter((m) => m.provider === key.provider),
          ...MUSIC_MODELS.filter((m) => m.provider === key.provider),
        ];
        const currentModelValid = allModelsForProvider.some(
          (m) => m.id === selectedModel,
        );
        if (allModelsForProvider.length > 0 && !currentModelValid) {
          setSelectedModel(allModelsForProvider[0].id);
        }
      }
    }
  }, [selectedKeyId, generationType]);

  // Reset to text mode when switching conversations
  useEffect(() => {
    setGenerationType(null);
  }, [activeConversationId]);

  // Auto-switch to generation mode when selecting a generation model
  useEffect(() => {
    if (!selectedModel) return;

    console.log("[Chat] useEffect triggered, selectedModel:", selectedModel);
    const modelLower = selectedModel.toLowerCase();

    // Infer type from model name patterns
    if (
      modelLower.includes("image") ||
      modelLower.includes("u1-fast") ||
      modelLower.includes("wanx") ||
      modelLower.includes("dall") ||
      modelLower.includes("imagen")
    ) {
      console.log("[Chat] Setting generationType to: image");
      setGenerationType("image");
    } else if (modelLower.includes("video") || modelLower.includes("hailuo")) {
      console.log("[Chat] Setting generationType to: video");
      setGenerationType("video");
    } else if (
      modelLower.includes("audio") ||
      modelLower.includes("speech") ||
      modelLower.includes("tts")
    ) {
      console.log("[Chat] Setting generationType to: audio");
      setGenerationType("audio");
    } else if (modelLower.includes("music")) {
      console.log("[Chat] Setting generationType to: music");
      setGenerationType("music");
    } else {
      console.log("[Chat] Setting generationType to: null (chat model)");
      setGenerationType(null);
    }
  }, [selectedModel]);

  // Handle conversation switch - scroll to bottom after messages are loaded
  useLayoutEffect(() => {
    // Track conversation changes
    const prevConversationId = lastConversationIdRef.current;
    if (activeConversationId !== prevConversationId) {
      lastConversationIdRef.current = activeConversationId;

      // Only scroll if we have messages and this is a valid conversation
      if (activeConversationId && messages.length > 0) {
        // Use requestAnimationFrame to ensure scroll happens after browser paint
        const rafId = requestAnimationFrame(() => {
          scrollToBottom();
        });

        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [activeConversationId, messages.length, scrollToBottom]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (streaming) {
      scrollToBottom();
    }
  }, [streaming, scrollToBottom]);

  // Fallback: scroll when messages update (handles case where conversation switch
  // happened but messages weren't ready yet in the closure)
  useEffect(() => {
    if (messages.length > 0 && activeConversationId) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom, activeConversationId]);

  const handleCopy = useCallback(async (content: string, id: string) => {
    await copyToClipboard(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleNewChat = async () => {
    await createConversation();
    clearMessages();
    setGenerationType(null); // Reset to text mode
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedKeyId || !selectedModel) {
      toast.error("Please select a key and model, and enter a message");
      return;
    }

    // Check if selected model is a generation model
    const modelInfo =
      IMAGE_MODELS.find((m) => m.id === selectedModel) ||
      VIDEO_MODELS.find((m) => m.id === selectedModel) ||
      AUDIO_MODELS.find((m) => m.id === selectedModel) ||
      MUSIC_MODELS.find((m) => m.id === selectedModel);

    if (modelInfo) {
      toast.error(
        `请选择聊天模型，${modelInfo.name} 是生成模型，需要从下拉列表中选择聊天模型`,
      );
      return;
    }

    if (streaming) {
      console.log("[Chat] Skipping send - streaming already in progress");
      return;
    }

    const message = input.trim();
    setInput("");

    if (!activeConversationId) {
      await createConversation();
    }

    await sendMessage(message, selectedKeyId, selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Check if model is a generation model (regardless of generationType state)
      const isGenerationModel =
        IMAGE_MODELS.some((m) => m.id === selectedModel) ||
        VIDEO_MODELS.some((m) => m.id === selectedModel) ||
        AUDIO_MODELS.some((m) => m.id === selectedModel) ||
        MUSIC_MODELS.some((m) => m.id === selectedModel);

      if (isGenerationModel) {
        // Determine the type from the model
        const modelLower = selectedModel.toLowerCase();
        let type: "image" | "video" | "audio" | "music" = "image";
        if (modelLower.includes("video") || modelLower.includes("hailuo")) {
          type = "video";
        } else if (modelLower.includes("audio") || modelLower.includes("speech") || modelLower.includes("tts")) {
          type = "audio";
        } else if (modelLower.includes("music")) {
          type = "music";
        }
        handleGenerate(type);
      } else {
        handleSend();
      }
    }
  };

  const handleGenerate = async (
    type: "image" | "video" | "audio" | "music",
  ) => {
    if (!input.trim() || !selectedKeyId) {
      toast.error("请输入提示词并选择密钥");
      return;
    }

    // Check if selected model is a chat model (not a generation model)
    const isChatModel =
      CHAT_MODELS.some((m) => m.id === selectedModel);

    if (isChatModel) {
      toast.error(
        `请选择生成模型，当前 ${selectedModel} 是聊天模型`,
      );
      return;
    }

    if (generating) return;
    setGenerating(true);

    const prompt = input.trim();
    const userMessageId = `gen-user-${Date.now()}`;
    const loadingMessageId = `gen-loading-${Date.now()}`;
    setInput("");

    // Immediately add user message to show in chat
    const userMessage = {
      id: userMessageId,
      role: "user" as const,
      content: prompt,
      timestamp: new Date().toISOString(),
      model: selectedModel,
      provider: "",
      keyId: selectedKeyId,
    };
    addMessages([userMessage]);

    // Add loading placeholder message
    const loadingMessage = {
      id: loadingMessageId,
      role: "assistant" as const,
      content: "",
      timestamp: new Date().toISOString(),
      generationType: type,
      isLoading: true,
      prompt: prompt,
      model: selectedModel,
      provider: "",
      keyId: selectedKeyId,
    };
    addMessages([loadingMessage]);

    try {
      const requestBody: Record<string, string | number> = {
        keyId: selectedKeyId,
        model: selectedModel,
        prompt,
      };
      // Add image_size for image generation
      if (type === "image") {
        requestBody.image_size = imageSize;
        requestBody.image_num = imageNum;
      }
      const response = await fetch(`/api/generation/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("[Generation] Error response:", errorData);

        // Remove loading message and show error
        const errorMessage = {
          id: `gen-error-${Date.now()}`,
          role: "assistant" as const,
          content: `生成失败: ${errorData.error || errorData.message || "Unknown error"}`,
          timestamp: new Date().toISOString(),
          generationType: type,
          isError: true,
        };
        // Remove loading message and add error
        updateMessage(loadingMessageId, {
          content: errorMessage.content,
          isError: true,
          isLoading: false,
        });
        setGenerating(false);
        return;
      }

      const result = await response.json();

      console.log("[Generation] Full response:", result);
      console.log("[Generation] result.data:", result.data);
      console.log("[Generation] result.data?.urls:", result.data?.urls);

      // Extract URL from result
      const imageUrl =
        result.data?.urls?.[0] ||
        result.data?.base64?.[0] ||
        result.url ||
        result.text ||
        JSON.stringify(result);

      console.log("[Generation] Result:", result);
      console.log("[Generation] Extracted imageUrl:", imageUrl);

      // Replace loading message with result
      updateMessage(loadingMessageId, {
        content: imageUrl,
        isLoading: false,
      });

      toast.success(`${type}生成成功`);
    } catch (error: any) {
      toast.error(error.message || "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  // Handle conversation selection and restore key/model
  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    // Restore key and model from messages after a short delay to allow store to update
    setTimeout(() => {
      const currentMessages = useChatStore.getState().messages;
      if (currentMessages.length === 0) return;
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage) {
        const currentKeys = useKeyStore.getState().keys;
        if (lastMessage.keyId && currentKeys.some((k) => k.id === lastMessage.keyId)) {
          setSelectedKeyId(lastMessage.keyId);
        }
        if (lastMessage.model) {
          setSelectedModel(lastMessage.model);
        }
      }
    }, 0);
  };

  return (
    <div className="h-full flex gap-6 min-h-0">
      {/* Conversations Sidebar */}
      <div className="w-64 shrink-0 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          <CardHeader className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">对话</CardTitle>
              <Button size="sm" variant="ghost" onClick={handleNewChat}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                暂无对话
              </div>
            ) : (
              <div className="p-2 group">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 transition-colors cursor-pointer group/item",
                      activeConversationId === conv.id
                        ? "bg-accent/10 text-accent"
                        : "hover:bg-surface-elevated text-text-secondary",
                    )}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 text-text-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {conv.title || "新对话"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted truncate">
                          {formatDate(conv.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover/item:opacity-100 hover:text-error"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("确定要删除这个对话吗？")) {
                          deleteConversation(conv.id);
                          if (activeConversationId === conv.id) {
                            clearMessages();
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* Model Selector */}
        <div className="shrink-0 flex items-center gap-4 mb-4 p-4 bg-surface rounded-xl border border-border">
          <div className="flex-1">
            <Label className="text-xs text-text-muted mb-1 block">
              服务商 / 密钥
            </Label>
            <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="请选择密钥" />
              </SelectTrigger>
              <SelectContent>
                {activeKeys.map((key) => {
                  const provider = PROVIDERS[key.provider as ProviderId];
                  return (
                    <SelectItem key={key.id} value={key.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: provider?.color }}
                        />
                        <span>{key.name}</span>
                        <span className="text-text-muted">
                          ({provider?.name})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label className="text-xs text-text-muted mb-1 block">模型</Label>
            {(() => {
              const selectedKey = keys.find((k) => k.id === selectedKeyId);
              const isCustom = selectedKey?.provider === "custom";

              // Custom provider: use stored models or input
              if (isCustom) {
                const hasModels =
                  selectedKey?.models && selectedKey.models.length > 0;
                if (hasModels) {
                  return (
                    <Select
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="请选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedKey!.models!.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }
                return (
                  <Input
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    placeholder="输入模型名称"
                    className="w-full"
                  />
                );
              }

              return (
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="请选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      ...CHAT_MODELS.filter(
                        (m) => m.provider === selectedKey?.provider,
                      ),
                      ...IMAGE_MODELS.filter(
                        (m) => m.provider === selectedKey?.provider,
                      ),
                      ...VIDEO_MODELS.filter(
                        (m) => m.provider === selectedKey?.provider,
                      ),
                      ...AUDIO_MODELS.filter(
                        (m) => m.provider === selectedKey?.provider,
                      ),
                      ...MUSIC_MODELS.filter(
                        (m) => m.provider === selectedKey?.provider,
                      ),
                    ].map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} ({model.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })()}
          </div>

          {activeConversationId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                deleteConversation(activeConversationId);
                clearMessages();
              }}
              className="mt-5"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Messages with ScrollArea */}
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4 max-w-8xl" ref={messagesContainerRef}>
              {messages.length === 0 && !streaming ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-surface-elevated mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-text-muted" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">开始对话</h3>
                  <p className="text-text-secondary max-w-md">
                    选择上方的模型和密钥，然后发送消息开始与 AI 对话。
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      onCopy={handleCopy}
                      copiedId={copiedId}
                    />
                  ))}
                  {streaming && <StreamingMessage />}
                </>
              )}
            </div>
            <div ref={messagesEndRef} className="h-px" />
          </div>

          {/* Input */}
          <div className="shrink-0 p-4">
            <div className="relative bg-surface/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm overflow-hidden">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                className="w-full bg-transparent px-5 py-4 resize-none text-sm placeholder:text-text-muted/50 focus:outline-none min-h-20"
                rows={3}
              />
              <div className="flex items-center justify-between px-5 pb-4">
                <div className="flex items-center gap-3">
                  {input.length > 0 && (
                    <span className="text-[11px] text-text-muted/40">{input.length} 字符</span>
                  )}
                  {/* Image size selector for image models */}
                  {IMAGE_MODELS.some((m) => m.id === selectedModel) && (
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="bg-surface-elevated border border-border/50 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
                    >
                      <option value="2048x2048">1:1 (2048×2048)</option>
                      <option value="1664x2496">2:3 (1664×2496)</option>
                      <option value="2496x1664">3:2 (2496×1664)</option>
                      <option value="1760x2368">3:4 (1760×2368)</option>
                      <option value="2368x1760">4:3 (2368×1760)</option>
                      <option value="1824x2272">4:5 (1824×2272)</option>
                      <option value="2272x1824">5:4 (2272×1824)</option>
                      <option value="2752x1536">16:9 (2752×1536)</option>
                      <option value="1536x2752">9:16 (1536×2752)</option>
                      <option value="3072x1376">21:9 (3072×1376)</option>
                      <option value="1344x3136">9:21 (1344×3136)</option>
                    </select>
                  )}
                  {/* Image number selector for image models */}
                  {IMAGE_MODELS.some((m) => m.id === selectedModel) && (
                    <select
                      value={imageNum}
                      onChange={(e) => setImageNum(Number(e.target.value))}
                      className="bg-surface-elevated border border-border/50 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30"
                    >
                      <option value={1}>1 张</option>
                      <option value={2}>2 张</option>
                      <option value={3}>3 张</option>
                      <option value={4}>4 张</option>
                    </select>
                  )}
                </div>
                <Button
                  onClick={() => {
                    // Check if model is a generation model (regardless of generationType state)
                    const isGenerationModel =
                      IMAGE_MODELS.some((m) => m.id === selectedModel) ||
                      VIDEO_MODELS.some((m) => m.id === selectedModel) ||
                      AUDIO_MODELS.some((m) => m.id === selectedModel) ||
                      MUSIC_MODELS.some((m) => m.id === selectedModel);

                    if (isGenerationModel) {
                      const modelLower = selectedModel.toLowerCase();
                      let type: "image" | "video" | "audio" | "music" = "image";
                      if (modelLower.includes("video") || modelLower.includes("hailuo")) {
                        type = "video";
                      } else if (modelLower.includes("audio") || modelLower.includes("speech") || modelLower.includes("tts")) {
                        type = "audio";
                      } else if (modelLower.includes("music")) {
                        type = "music";
                      }
                      handleGenerate(type);
                    } else {
                      handleSend();
                    }
                  }}
                  disabled={
                    !input.trim() ||
                    !selectedKeyId ||
                    !selectedModel ||
                    streaming ||
                    generating
                  }
                  className="h-9 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:scale-100 gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {IMAGE_MODELS.some((m) => m.id === selectedModel) ||
                      VIDEO_MODELS.some((m) => m.id === selectedModel) ||
                      AUDIO_MODELS.some((m) => m.id === selectedModel) ||
                      MUSIC_MODELS.some((m) => m.id === selectedModel)
                        ? "生成中..."
                        : "发送中..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      {IMAGE_MODELS.some((m) => m.id === selectedModel) ||
                      VIDEO_MODELS.some((m) => m.id === selectedModel) ||
                      AUDIO_MODELS.some((m) => m.id === selectedModel) ||
                      MUSIC_MODELS.some((m) => m.id === selectedModel)
                        ? "生成"
                        : "发送"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Lightbox for image preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
