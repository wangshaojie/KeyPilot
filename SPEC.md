# KeyPilot - AI Key Aggregation Platform

## 1. Concept & Vision

KeyPilot is a local-first, privacy-centric AI key management platform that feels like a professional command center for AI resources. The interface evokes a sophisticated mission control aesthetic — clean, data-rich, and reassuringly technical — while remaining approachable for developers. Every interaction reinforces trust: your keys never leave your machine.

The design language is **"Technical Sanctuary"** — a calm, focused environment where complex AI operations feel organized and under control. Think Bloomberg Terminal meets modern dev tools.

---

## 2. Design Language

### Aesthetic Direction
**"Technical Sanctuary"** — Dark-first interface with warm accent colors, subtle depth through glass morphism, and data-forward layouts that make users feel like they're managing valuable assets professionally.

### Color Palette

**Dark Theme (Default)**
| Role | Color | Usage |
|------|-------|-------|
| Background | `#0c0c0e` | Main canvas |
| Surface | `#141416` | Cards, panels |
| Surface Elevated | `#1c1c20` | Modals, dropdowns |
| Border | `#2a2a30` | Dividers, card borders |
| Text Primary | `#fafafa` | Headlines, important |
| Text Secondary | `#a1a1aa` | Body, descriptions |
| Text Muted | `#71717a` | Placeholders, hints |
| Accent Orange | `#f97316` | Primary actions, highlights |
| Accent Green | `#22c55e` | Success, active keys |
| Accent Red | `#ef4444` | Errors, disabled |
| Accent Blue | `#3b82f6` | Info, links |

**Light Theme**
| Role | Color | Usage |
|------|-------|-------|
| Background | `#fafafa` | Main canvas |
| Surface | `#ffffff` | Cards, panels |
| Surface Elevated | `#f4f4f5` | Modals, dropdowns |
| Border | `#e4e4e7` | Dividers |
| Text Primary | `#18181b` | Headlines |
| Text Secondary | `#52525b` | Body |
| Accent Orange | `#ea580c` | Primary actions |

### Typography
- **Headlines:** `Geist` (fallback: `Inter`, system-ui) — `font-semibold tracking-tight`
- **Body:** `Geist` — `font-normal`
- **Monospace (keys, code):** `JetBrains Mono` — for API keys, JSON, code snippets
- **Scale:** `text-xs` (12px) / `text-sm` (14px) / `text-base` (16px) / `text-lg` (18px) / `text-xl` (20px) / `text-2xl` (24px) / `text-3xl` (30px)

### Spatial System
- Base unit: `4px`
- Card padding: `24px` (p-6)
- Section gaps: `32px` (gap-8)
- Border radius: `12px` (rounded-xl) for cards, `8px` (rounded-lg) for buttons, `6px` (rounded) for inputs
- Max content width: `1400px` (max-w-[1400px])

### Motion Philosophy
- **Purposeful, not decorative** — animations communicate state changes
- **Snappy interactions** — `150-200ms` for micro-interactions
- **Smooth reveals** — `300-400ms` for page/section transitions
- **Spring physics** — `stiffness: 300, damping: 30` for interactive elements
- **Reduced motion respected** — all animations honor `prefers-reduced-motion`

### Visual Assets
- **Icons:** Lucide React — consistent 24px stroke icons
- **Empty states:** Custom SVG illustrations (minimal, line-art style)
- **Status indicators:** Pulsing dots for active, static for inactive

---

## 3. Layout & Structure

### Overall Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo + Navigation Tabs + Theme Toggle + Settings  │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  Sidebar   │              Main Content Area                 │
│  (Context  │                                                │
│  sensitive)│                                                │
│            │                                                │
├────────────┴────────────────────────────────────────────────┤
│  Status Bar: Connection status, last sync, version          │
└─────────────────────────────────────────────────────────────┘
```

### Page Structure

**1. Dashboard (Home)**
- Quick stats: Total keys, active keys, today's usage,本月账单预估
- Recent activity feed
- Quick actions: Add key, Test all keys, Start chat

**2. Keys Management**
- Filterable/sortable table of all keys
- Provider logos + key nickname + status + last used + usage this month
- Inline actions: Edit, Test, Delete, Toggle active
- Bulk actions: Export, Import, Delete selected

**3. Chat (Unified Conversation)**
- Split layout: Model selector sidebar (left) + Chat area (right)
- Model selector grouped by provider with availability indicators
- Chat messages with markdown rendering, code syntax highlighting
- Streaming response support
- Conversation history sidebar

**4. Speed Test**
- Visual speed comparison chart (bar chart)
- Per-key latency results: TTFT (Time to First Token), TPS (Tokens Per Second)
- Test history with trends
- Test configuration: Model, prompt length, iterations

**5. Statistics**
- Usage by provider (pie/donut chart)
- Usage over time (line chart)
- Top used models
- Cost estimation (if pricing available)
- Export data as JSON/CSV

**6. Image Generation**
- Model selector (DALL-E, Stable Diffusion, Midjourney if configured)
- Image prompt input with generation params
- Generated images gallery with history
- Download/copy actions

**7. Settings**
- API endpoint configuration (base URL for proxies)
- Theme preference
- Data export/import
- About / License

### Responsive Strategy
- Primary target: Desktop 1280px+
- Tablet (768px-1279px): Collapsible sidebar, stacked layouts
- Mobile: Not a primary target but graceful degradation

---

## 4. Features & Interactions

### Core Features

#### 4.1 Key Management
- **Add Key:** Modal with fields: Provider (dropdown), Nickname, API Key (masked input), Base URL (optional, for proxies), Enabled toggle
- **Edit Key:** Same modal, pre-filled
- **Delete Key:** Confirmation dialog with key nickname
- **Test Key:** Single key test with result toast (success/latency or error)
- **Toggle Key:** Enable/disable without deleting

**Supported Providers:**
- OpenAI (GPT series, DALL-E, Embeddings)
- Anthropic (Claude series)
- Google AI (Gemini series)
- Azure OpenAI (with deployment support)
- Custom/Other (base URL + generic endpoint)

#### 4.2 Unified Chat
- **Provider Selection:** Dropdown with all active keys, grouped by provider
- **Model Selection:** Context-aware — selecting provider filters available models
- **Conversation:** Standard chat UI with:
  - User message (right-aligned, accent background)
  - Assistant message (left-aligned, surface background, markdown rendered)
  - Code blocks with copy button
  - Streaming indicator (animated dots)
- **Conversation History:** Local storage, searchable, deletable

#### 4.3 Speed Testing
- **Test Single Key:** Click "Test" on any key card
- **Test All:** Batch test all active keys simultaneously
- **Results Display:**
  - Latency in ms (bar chart comparison)
  - TTFT (Time To First Token)
  - Throughput (tokens/sec)
  - Status: Pass / Fail / Timeout
- **Test Parameters:** Configurable prompt, model, iterations

#### 4.4 Usage Statistics
- **Data Collection:** Track per-key usage (request count, token count if available)
- **Visualizations:**
  - Donut chart: Usage by provider
  - Line chart: Usage over time (daily/weekly/monthly)
  - Bar chart: Top 10 models by usage
- **Export:** Download as JSON or CSV

#### 4.5 Image Generation
- **Model Support:** OpenAI DALL-E 3, DALL-E 2, Azure DALL-E (if Azure key)
- **Interface:** Prompt textarea + size selector + quality selector
- **Output:** Grid of generated images with download option
- **History:** Past generations with prompts saved locally

### Interaction Details

| Element | Hover | Active | Disabled |
|---------|-------|--------|----------|
| Primary Button | `opacity-90`, `scale-[1.02]` | `scale-[0.98]` | `opacity-50`, `cursor-not-allowed` |
| Key Card | `border-accent` glow | - | Grayscale, `opacity-60` |
| Nav Item | `bg-surface-elevated` | `text-accent`, left border | - |
| Input | `border-accent` | Ring `ring-accent/30` | `bg-muted`, `cursor-not-allowed` |
| Table Row | `bg-surface-elevated` | - | - |

### Error Handling
- **API Key Invalid:** Toast notification + key status turns red
- **Network Error:** Retry button + fallback message in chat
- **Rate Limited:** Warning badge on key + toast with retry time
- **Empty States:**
  - No keys: Illustration + "Add your first API key" CTA
  - No chat history: "Start a conversation" placeholder
  - No usage data: "Start using AI to see statistics"

---

## 5. Component Inventory

### Layout Components

**AppShell**
- Fixed header, collapsible sidebar, main content area
- States: Sidebar expanded / collapsed
- Theme-aware backgrounds

**Header**
- Logo (left), Nav tabs (center), Theme toggle + Settings (right)
- Sticky, `backdrop-blur` on scroll

**Sidebar**
- Width: `280px` expanded, `64px` collapsed (icon-only)
- Nav items with icons + labels
- Collapse toggle at bottom

**StatusBar**
- Fixed bottom, small text
- Shows: Backend connection status, last activity, version

### UI Components

**KeyCard**
- Provider logo, nickname, key preview (****1234), status dot
- Usage badge (e.g., "$12.50"), last used timestamp
- Actions: Edit, Test, Delete (icon buttons on hover)
- States: Active (green dot), Inactive (gray dot), Error (red dot), Testing (pulsing)

**KeyTable**
- Sortable columns: Provider, Nickname, Status, Usage, Last Used
- Row hover reveals actions
- Bulk selection checkbox
- Pagination (if >20 keys)

**ChatMessage**
- Avatar (user: initial, assistant: logo)
- Message content with markdown
- Timestamp
- Copy button on code blocks

**ModelSelector**
- Grouped dropdown by provider
- Each option shows: Model name, provider icon, availability
- Selected state: Checkmark + accent border

**StatCard**
- Icon + label + value + trend indicator
- Hover: Subtle lift (`translate-y-[-2px]`)
- Loading: Skeleton pulse

**SpeedTestChart**
- Horizontal bar chart
- Bars colored by result (green: fast, yellow: medium, red: slow)
- Hover: Tooltip with exact values

**ImageGallery**
- Masonry or grid layout
- Each image: Thumbnail + prompt preview + timestamp
- Hover: Overlay with download/copy actions

### Form Components

**Input**
- Label above, helper text below
- Error state: Red border + error message
- Password variant with show/hide toggle

**Select**
- Native-like dropdown with custom styling
- Search filter for long lists
- Multi-select variant for bulk operations

**Button**
- Variants: Primary (accent bg), Secondary (border), Ghost (no bg), Destructive (red)
- Sizes: sm, md, lg
- Loading state with spinner

**Dialog/Modal**
- Centered, backdrop blur
- Close button top-right
- Focus trap inside
- Escape to close

**Toast**
- Bottom-right stack
- Variants: Success (green), Error (red), Warning (yellow), Info (blue)
- Auto-dismiss (5s) with progress bar
- Dismiss button

---

## 6. Technical Approach

### Frontend Architecture

**Framework:** React 18 + TypeScript + Vite

**Key Libraries:**
- `shadcn/ui` — Base UI components (built on Radix UI)
- `TailwindCSS` — Styling
- `Zustand` — State management
- `Axios` — HTTP client
- `React Router v6` — Routing
- `react-markdown` + `rehype-highlight` — Chat message rendering
- `recharts` — Statistics charts
- `date-fns` — Date formatting
- `lucide-react` — Icons
- `sonner` — Toast notifications

**Directory Structure:**
```
frontend/
├── public/
│   └── assets/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── layout/          # AppShell, Header, Sidebar
│   │   ├── keys/            # KeyCard, KeyTable, KeyDialog
│   │   ├── chat/            # ChatMessage, ChatInput, ModelSelector
│   │   ├── stats/           # StatCard, Charts
│   │   └── images/          # ImageGallery, ImageGenerator
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Keys.tsx
│   │   ├── Chat.tsx
│   │   ├── SpeedTest.tsx
│   │   ├── Statistics.tsx
│   │   ├── ImageGeneration.tsx
│   │   └── Settings.tsx
│   ├── stores/
│   │   ├── useKeyStore.ts
│   │   ├── useChatStore.ts
│   │   └── useSettingsStore.ts
│   ├── lib/
│   │   ├── api.ts           # Axios instance
│   │   ├── utils.ts         # Helpers
│   │   └── constants.ts     # Providers, models
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

### Backend Architecture

**Framework:** Node.js + Express + TypeScript

**Design Principles:**
- Zero external database dependencies
- JSON file-based storage
- RESTful API
- CORS enabled for local development
- No external network requests (privacy)

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/keys` | List all keys |
| POST | `/api/keys` | Add new key |
| PUT | `/api/keys/:id` | Update key |
| DELETE | `/api/keys/:id` | Delete key |
| POST | `/api/keys/:id/test` | Test single key |
| POST | `/api/keys/test-all` | Test all keys |
| GET | `/api/usage` | Get usage statistics |
| POST | `/api/chat` | Send chat message |
| GET | `/api/chat/history` | Get chat history |
| POST | `/api/images/generate` | Generate image |
| GET | `/api/images/history` | Get image history |
| GET | `/api/providers` | Get supported providers/models |
| POST | `/api/settings` | Update settings |
| GET | `/api/settings` | Get settings |

**Data Model:**

```typescript
// Key
interface APIKey {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  name: string;
  key: string; // encrypted in production, plain for MVP
  baseUrl?: string;
  enabled: boolean;
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
  usageCost?: number;
}

// Chat Message
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
  provider: string;
  keyId: string;
  timestamp: string;
  tokens?: number;
}

// Chat Conversation
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Image Generation
interface ImageGeneration {
  id: string;
  prompt: string;
  model: string;
  provider: string;
  keyId: string;
  imageUrl: string; // local path or base64
  createdAt: string;
}

// Usage Record
interface UsageRecord {
  keyId: string;
  date: string;
  requestCount: number;
  tokenCount: number;
  cost: number;
}

// Settings
interface Settings {
  theme: 'dark' | 'light' | 'system';
  baseUrl?: string; // proxy base URL
  lastSync?: string;
}
```

**Storage Files:**
```
backend/data/
├── keys.json
├── conversations.json
├── imageHistory.json
├── usage.json
└── settings.json
```

### API Design

**Request/Response Patterns:**

```typescript
// Standard Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Chat Request
interface ChatRequest {
  keyId: string;
  model: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
}

// Chat Response (non-streaming)
interface ChatResponse {
  content: string;
  model: string;
  tokens?: number;
  latency?: number;
}

// Speed Test Result
interface SpeedTestResult {
  keyId: string;
  status: 'success' | 'error' | 'timeout';
  latency: number;
  ttft?: number; // time to first token
  tps?: number; // tokens per second
  error?: string;
}
```

---

## 7. Implementation Notes

### Security Considerations
- API keys stored locally in plain JSON (MVP) — production could add encryption
- No external network calls except to AI providers
- CORS configured for `localhost` only by default
- No telemetry or analytics

### Performance Considerations
- Lazy load routes with `React.lazy`
- Debounce API calls (especially chat)
- Virtualize long lists (key table, chat history)
- Web Workers for heavy computations (if needed)

### Accessibility
- All interactive elements keyboard accessible
- Focus visible states
- Screen reader labels
- Reduced motion support

---

## 8. Out of Scope (MVP)

- User authentication / multi-user
- Team collaboration
- Cloud sync
- Key rotation automation
- Advanced caching
- Plugin system
