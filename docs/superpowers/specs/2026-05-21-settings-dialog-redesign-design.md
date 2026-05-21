# Settings Dialog Redesign

Date: 2026-05-21
Status: Approved in conversation, pending user review of written spec

## Goal

Redesign the settings dialog from the current tab-based layout to a macOS System
Settings-style two-panel layout (sidebar + content panel), resolving the height
jumping issue on tab switch and reducing visual clutter as settings grow.

## Non-Goals

This change will not:
- Add new settings or features beyond what currently exists
- Change the Zustand store shape or add new store slices
- Modify the BgColorPicker component (it stays the same)
- Change the shadcn Dialog component itself
- Add actual functionality to the font preview card (visual only for now)

## Design Decisions

### Two-panel sidebar layout over tabs

The current `Tabs` approach causes the dialog height to jump when switching
between tabs of different content heights. A sidebar + content panel layout
fixes this by fixing the dialog height and allowing independent scrolling in
each panel.

The design references macOS System Settings: a fixed-width sidebar with icons
and category names, and a content panel that changes based on selection.

### Fixed dialog height with independent scroll areas

The dialog container has a fixed `h-[520px]` (or similar) and `overflow:
hidden`. The sidebar scrolls independently if its items overflow. The content
panel scrolls independently if its content overflows. This eliminates the
height jumping issue entirely.

### Font preview card

The "字体" group gets a special layout: left side shows font settings
(size/weight/spacing/line-height/font-family), right side shows a mock Weibo
post card that reflects font changes in real time. The preview card is
`position: sticky` and does not scroll with the settings list.

### Inline effect illustrations

Settings that benefit from visual explanation (图片蒙版, X 操作栏布局, 关注分组,
QuoteChains 渲染, QuoteChains 折叠) have a dashed placeholder below the setting
row for before/after screenshots. User fills these in later.

## Architecture

### Component Tree

```
Dialog (radix)
└── DialogContent (fixed 640px width, fixed height)
    ├── Header ("设置" title + close button)
    ├── Body (flex row, min-height:0, flex:1)
    │   ├── Sidebar (w-[180px], overflow-y-auto)
    │   │   └── SidebarItem × 4 (icon + label, selectable)
    │   └── ContentPanel (flex:1, overflow-y-auto, flex-col)
    │       ├── [Group: 外观] → SettingField × 3
    │       ├── [Group: 个性化] → SettingField × 7 (some with Illustration)
    │       ├── [Group: 字体] → FontSettingsPanel
    │       │   ├── FontSettingsList (scrollable settings)
    │       │   └── FontPreviewCard (sticky, fixed)
    │       └── [Group: 高级] → SettingField × 2
    └── Footer (version + links, optional/integrated)
```

### Settings Groups

#### 外观
| Setting | Control |
|---------|---------|
| 深色模式 | Select: 跟随系统 / 浅色 / 深色 |
| 浅色模式背景色 | BgColorPicker (4 dots) |
| 深色模式背景色 | BgColorPicker (4 dots) |

#### 个性化
| Setting | Control | Illustration |
|---------|---------|-------------|
| 热搜卡片 | Switch | No |
| 图片蒙版 | Switch | Yes |
| 内容宽度 | Select: 标准 / 宽 / 更宽 | No |
| X 操作栏布局 | Switch | Yes |
| 关注分组 | Switch | Yes |
| QuoteChains 渲染 | Switch | Yes |
| 折叠 QuoteChains | Switch (conditional) | Yes |

#### 字体
| Setting | Control |
|---------|---------|
| 字体大小 | Select: 12px–36px |
| 字体粗细 | Select: 100–900 |
| 字间距 | Select: 更紧凑–最宽松 |
| 行高 | Select: 无–更宽松 |
| 字体样式 | Select: 本地字体 + 远程字体 |
| 恢复默认 | Button (resets all font settings) |

#### 高级
| Setting | Control |
|---------|---------|
| 内置话题页 | Switch |
| 浏览历史 | Switch |

### Sidebar Icons

| Group | Icon (Lucide) | Label |
|-------|---------------|-------|
| 外观 | `Palette` | 外观 |
| 个性化 | `Sparkles` | 个性化 |
| 字体 | `Type` | 字体 |
| 高级 | `Settings` | 高级 |

All icons use `lucide-react` with consistent `size={16}` and
`strokeWidth={1.5}`. `Sparkles` is already imported elsewhere in the project.
`Palette`, `Type`, and `Settings` are standard Lucide icons.

### Data Flow

- All settings values and setters come from Zustand store via `useAppSettings`
- Active sidebar selection is local `useState` state
- Font preview card reads current font settings from Zustand store and applies
  them to a mock post card using Tailwind utility classes
- Illustration URIs are local static assets or external URLs, passed as props

### Dialog Dimensions

| Property | Value |
|----------|-------|
| Width | `max-w-[640px]` |
| Height | `h-[520px]` (fixed) |
| Sidebar width | `w-[180px]` |
| Border radius | `rounded-lg` (inherited from DialogContent) |

## Visual Design Rules

Following the project's design-taste-frontend conventions:

- No emojis — use Phosphor/Lucide icons
- Neutral zinc/slate palette, single accent color
- Sidebar selected state: accent background with white text
- Sidebar unselected: transparent with muted text, `hover:text-foreground`
- Setting rows: `divide-y divide-border/40`, no individual card borders
- Labels: `text-sm font-medium`
- Descriptions: `text-xs text-muted-foreground`
- Illustrations: `border-2 border-dashed` placeholder, 8px rounded, centered text
- Font preview card: `border-l` separator, `bg-muted/30` background

## Components to Create/Modify

### Modified
- `src/lib/weibo/components/settings-dialog.tsx` — complete rewrite

### New Internal Components (within same file or extracted)
- `SettingsLayout` — two-panel wrapper with sidebar state
- `Sidebar` — navigation list with icon + label
- `ContentPanel` — renders content based on active sidebar selection
- `FontPreviewCard` — mock Weibo post that reflects font settings
- `IllustrationPlaceholder` — dashed box with placeholder text

## Testing

- Unit tests pass (settings store behavior unchanged)
- Manual verification: dialog height stable across all group switches
- Manual verification: font settings change reflected in preview card
- Manual verification: sidebar scrolls independently when groups exceed height

## Future Considerations

- User supplies actual screenshots for illustration placeholders
- Font preview card could become interactive (clickable post elements) if needed
- Additional sidebar groups can be added by inserting into the groups array
