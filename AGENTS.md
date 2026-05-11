# AGENTS.md

## Project Overview

xb is a browser extension that rewrites weibo.com into a cleaner X-like reading
experience. Built with WXT, React 19, TypeScript, Tailwind CSS 4, shadcn/ui,
Zustand, and TanStack Query.

## Developer Commands

```bash
npm run dev          # Start dev server (Chrome)
npm run dev:firefox  # Start dev server (Firefox)
npm run build        # Build for Chrome/Chromium
npm run build:firefox # Build for Firefox
npm run test:unit    # Run unit tests (Vitest + jsdom)
npm run test:watch   # Run tests in watch mode
npm run compile      # TypeScript type check only
npm run zip          # Package as .zip (Chrome)
npm run zip:firefox  # Package as .zip (Firefox)
```

## Verification Order

lint → typecheck → test → build

## Project Structure

```
src/
├── entrypoints/          # Extension entry points
│   ├── weibo.content.tsx      # Main content script (weibo.com)
│   ├── weibo-main-world.ts    # Runs in page context, installs history bridge
│   ├── weibo-hide.content.ts  # Hides original Weibo UI
│   ├── weibo-search.pending.ts # Search pending handler
│   └── options/              # Options page
├── lib/                  # Core library (moved from features/weibo/)
│   ├── app-settings-store.ts  # Zustand settings store (hydrate before use)
│   ├── app-settings.ts        # Settings types and defaults
│   ├── font-loader.ts         # Font loading utility
│   ├── weibo/                 # Core weibo feature code
│   │   ├── app/               # App shell, root, layout components
│   │   ├── components/        # Feature-specific components
│   │   │   └── gen-image/     # Share card generation (11 templates)
│   │   ├── pages/             # Page-level components
│   │   ├── services/          # API clients, adapters, repositories
│   │   │   ├── client.ts       # Axios-based API client
│   │   │   └── auth-events.ts # Auth event handling
│   │   ├── models/            # Data models
│   │   ├── queries/           # TanStack Query definitions
│   │   ├── route/             # Router sync, page descriptors, URL parsing
│   │   ├── content/           # Host selectors, shell state, page takeover
│   │   ├── inject/            # Script injection (history bridge, API bridge)
│   │   ├── platform/          # Platform-specific code (messages, current user)
│   │   └── utils/             # Utility functions (transform, date, etc.)
├── components/ui/        # shadcn/ui components
├── hooks/                # Shared React hooks
└── test/                 # Test setup (vitest + jsdom)
```

## Architecture Notes

- **Content Script UI**: Uses WXT's `createShadowRootUi` with
  `cssInjectionMode: 'ui'` to mount React into a shadow root, keeping styles
  isolated from Weibo's global CSS.
- **weibo-main-world.ts**: Runs as an **unlisted script** directly in the page
  context (not a content script), installs a history bridge for router sync.
- **Settings Store**: Zustand store (`src/lib/app-settings-store.ts`) that
  persists to `chrome.storage`. Must call `hydrate()` before use.
- **API Layer**: Axios-based client (`lib/weibo/services/client.ts`) with
  adapters in `lib/weibo/services/adapters/` that transform Weibo's API
  responses into internal models.
- **Query Layer**: TanStack Query definitions in
  `lib/weibo/queries/weibo-queries.ts` wrapping repository functions.

## Key Patterns

- **Host selectors** in `lib/weibo/content/host-selectors.ts` wait for Weibo DOM
  elements before mounting
- **Shell state** (`lib/weibo/content/shell-state.ts`) binds React app to
  Weibo's existing DOM structure
- **Page takeover** (`lib/weibo/content/page-takeover.ts`) marks pages as
  handled
- **Router sync** (`lib/weibo/route/router-sync.ts`) keeps extension in sync
  with Weibo's navigation
- **URL parsing** (`lib/weibo/route/parse-weibo-url.ts`) parses Weibo URLs into
  page descriptors
- **API bridge** (`lib/weibo/inject/install-api-bridge.ts`) injects API bridge
  into page context

## Component Patterns

### Settings Dialog

设置面板使用 Zustand store + Select/Switch 控件，通过 `useAppSettings`
选择性订阅状态：

```typescript
const fontSizeClass = useAppSettings((s) => s.fontSizeClass)
const setFontSizeClass = useAppSettings((s) => s.setFontSizeClass)
```

### Mutations

当使用 TanStack Query `useMutation`，通过 `invalidates` meta 刷新相关查询缓存：

```typescript
const followMutation = useMutation({
  mutationFn: () => followUser(uid),
  meta: {
    invalidates: [
      ['weibo', 'profile'],
      ['weibo', 'profile-hover'],
    ],
  },
})
```

### Profile Components

Profile 页面共享组件在 `lib/weibo/components/profile-shared.tsx`：

- `ProfileBanner` - 横幅图片或备用背景
- `ProfileMutualFollowers` - 共同关注者头像列表
- `formatProfileCount` - 数字格式化（支持万为单位的中文格式，如 `1.2万`）

### Font Settings

字体系统由 `font-loader.ts` 和 `use-font-settings.ts` 组成，支持：

- 预装字体（宋体、仿宋、黑体、楷体）
- 可下载开源字体（霞鹜文楷、得意黑、朱雀仿宋、思源宋体、思源黑体、方正楷体、仓耳今楷）

### Reply Chain Rendering

转发链渲染通过 `app-settings.ts` 中的 `renderReplyChainEnabled` 配置控制：

- 开启时：`//@ 用户名:` 渲染为引用样式（blockquote）
- 关闭时：保持原文本格式

## Testing

- Vitest with `jsdom` environment
- Setup file: `src/test/setup.ts` (imports jest-dom)
- Test files: `*.test.ts` or `*.spec.ts` alongside source files
- Component tests use `@testing-library/react`

## Code Quality

- **Linter**: oxlint (strict mode, TypeScript/React/unicorn plugins)
- **Formatter**: oxfmt (semicolon: false, single quotes, sorted imports)
- **TypeScript**: Extends `.wxt/tsconfig.json`

## Browser Extension Notes

- Manifest v3 (WXT default)
- Permissions: `storage`
- Host permissions: `https://weibo.com/*`, `https://www.weibo.com/*`
- Web accessible resource: `weibo-main-world.js` (injected at runtime)
