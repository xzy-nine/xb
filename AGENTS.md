# AGENTS.md

## 项目概述

xb 是一个浏览器扩展，将 weibo.com 重写为更简洁的类 X 阅读体验。使用 WXT、React 19、TypeScript、Tailwind CSS 4、shadcn/ui、
motion（与 framer-motion 相同）、Zustand、TanStack Query 和 `@reactuses/core` 构建。

## 开发者命令

```bash
npm run dev          # 启动开发服务器（Chrome）
npm run dev:firefox  # 启动开发服务器（Firefox）
npm run build        # 构建 Chrome/Chromium 版本
npm run build:firefox # 构建 Firefox 版本
npm run test:unit    # 运行单元测试（Vitest + jsdom）
npm run test:watch   # 以监听模式运行测试
npm run compile      # 仅进行 TypeScript 类型检查
npm run zip          # 打包为 .zip（Chrome）
npm run zip:firefox  # 打包为 .zip（Firefox）
```

- 包管理器使用 **bun**（项目已配置 `only-allow bun`）

## 验证顺序

lint → typecheck → test → build

## 项目结构

```
src/
├── entrypoints/          # 扩展入口点
│   ├── weibo.content.tsx      # 主内容脚本（weibo.com）
│   ├── weibo-main-world.ts    # 在页面上下文运行，安装历史桥接
│   ├── weibo-hide.content.ts  # 隐藏原始 Weibo UI 元素
│   ├── weibo-search.pending.ts # 搜索待处理程序处理
│   └── options/               # 选项页面（theme.ts）
├── lib/                  # 核心库
│   ├── app-settings-store.ts  # Zustand 设置存储（在使用前预热）
│   ├── app-settings.ts        # 设置类型和默认值
│   ├── font-loader.ts         # 字体加载工具
│   ├── utils.ts               # 共享工具（cn helper 等）
│   ├── weibo/                 # 核心 Weibo 根本代码
│   │   ├── app/               # 应用外壳、根组件、布局组件
│   │   ├── components/        # 特定功能的组件
│   │   │   ├── gen-image/     # 分享卡片生成（9 种模板）
│   │   │   └── media-player/  # 音频/视频/直播播放器组件
│   │   ├── hooks/             # 特定功能的钩子（useFontSettings 等）
│   │   ├── pages/             # 页面页面组件
│   │   ├── services/          # API 客户端、适配器、仓库
│   │   │   ├── client.ts           # Axios 基于的 API 客户端
│   │   │   ├── endpoints.ts       # API 定义点定义
│   │   │   ├── weibo-repository.ts # 仓库层
│   │   │   ├── adapters/          # 响应适配器
│   │   │   └── auth-events.ts     # 认证事件处理程序
│   │   ├── models/            # 数据模型
│   │   ├── queries/           # TanStack Query 定义程序
│   │   ├── route/             # 路由同步、页面描述符、URL解析器
│   │   ├── content/           # 主内容脚本、页面接管、路由同步
│   │   ├── inject/            # 脚本注入（历史桥接、 API 桥接）
│   │   ├── platform/          # 平台特定代码 (messages, current user)
│   │   └── utils/             # 工具函数（日期、时间等）
├── components/ui/        # shadcn/ui 组件库
├── hooks/                # 共享 React 钩子
└── test/                 # 测试设置（Vitest + jsdom）
```

## 架构注意事项

- **主内容脚本 UI**: 使用 WXT 的 `createShadowRootUi` 和
  `cssInjectionMode: 'ui'` 将 React 挂载到 shadow root，保持样式与
  Weibo 全局 CSS 隔离。
- **weibo-main-world.ts**: 作为 **unlisted script** 直接运行在页面
  上下文（非 content script），安装 history bridge 以实现路由同步。
- **Settings Store**: Zustand 设置存储 (`lib/app-settings-store.ts`)，持久化到
  `chrome.storage`。使用前必须调用 `hydrate()`。
- **API Layer**: 基于 Axios 的 API 客户端 (`lib/weibo/services/client.ts`)，配合
  `lib/weibo/services/adapters/` 中的响应适配器将 Weibo API 响应转换为内部模型。
- **Query Layer**: TanStack Query 定义程序，位于
  `lib/weibo/queries/weibo-queries.ts`。

## 关键模式

- **Hooks 优先级**: 开发中需要常规 hooks（如 useDebounce、useLocalStorage、useWindowSize 等）时，先检查
  `@reactuses/core` 是否提供，优先使用已有的，避免自行重复实现
- **Host selectors**: `lib/weibo/content/host-selectors.ts` 中的 Host selectors
  等待 Weibo DOM 元素出现后再挂载
- **Shell state**: `lib/weibo/content/shell-state.ts` 将 React 应用绑定到
  Weibo 现有的 DOM 结构
- **Page takeover**: `lib/weibo/content/page-takeover.ts` 标记已处理的页面
- **Router sync**: `lib/weibo/route/router-sync.ts` 保持扩展与 Weibo 导航同步
- **URL parsing**: `lib/weibo/route/parse-weibo-url.ts` 解析 Weibo URL 为
  页面描述符
- **API bridge**: `lib/weibo/inject/install-api-bridge.ts` 将 API 桥接注入到页面上下文

## 组件模式

### 设置对话框

设置面板使用 Zustand store + Select/Switch 控件，通过 `useAppSettings`
选择性订阅状态：

```typescript
const fontSizeClass = useAppSettings((s) => s.fontSizeClass)
const setFontSizeClass = useAppSettings((s) => s.setFontSizeClass)
```

### Mutations（变更）

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

### Profile 组件

Profile 页面共享组件在 `lib/weibo/components/profile-shared.tsx`：

- `ProfileBanner` - 横幅图片或备用背景
- `ProfileMutualFollowers` - 共同关注者头像列表
- `formatProfileCount` - 数字格式化（支持万为单位的中文格式，如 `1.2万`）

### 字体设置

字体系统由 `font-loader.ts` 和 `use-font-settings.ts` 组成，支持：

- 预装字体（宋体、仿宋、黑体、楷体）
- 可下载开源字体（霞鹜文楷、得意黑、朱雀仿宋、思源宋体、思源黑体、方正楷体、仓耳今楷）

### 主题与背景

应用支持三种主题模式（light / dark / system）和多种背景色预设，配置在
`app-settings.ts`：

- 亮色预设：纯白、纸张、护眼黄、浅灰
- 暗色预设：深灰、纯黑、暗灰、暖黑

组件通过 `useAppSettings` 读取 `appTheme` / `bgColorPreset` 应用样式。

### 转发链渲染

转发链渲染通过 `app-settings.ts` 中的 `renderReplyChainEnabled` 配置控制：

- 开启时：`//@ 用户名:` 渲染为引用样式（blockquote）
- 关闭时：保持原文本格式

## 测试

- Vitest + jsdom 环境
- Setup 文件: `src/test/setup.ts` (导入 jest-dom)
- 测试文件: 源文件同目录下的 `*.test.ts` 或 `*.spec.ts`
- 组件测试使用 `@testing-library/react`

## 代码质量

- **Linter**: oxlint（strict 模式，TypeScript/React/unicorn 插件）
- **Formatter**: oxfmt（semicolon: false, 单引号, sorted imports）
- **TypeScript**: 继承 `.wxt/tsconfig.json`

## 浏览器扩展说明

- Manifest v3（WXT 默认）
- 权限: `storage`
- 主机权限: `https://weibo.com/*`, `https://www.weibo.com/*`,
  `https://*.sinaimg.cn/*`, `https://*.sinajs.cn/*`, `https://*.weibocdn.com/*`
- Web 可访问资源: `weibo-main-world.js`（运行时注入）
