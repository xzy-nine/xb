---
name: xb
description: A browser extension that rewrites weibo.com into a cleaner, X-like reading experience
colors:
  canvas: 'oklch(1 0 0)'
  surface: 'oklch(0.97 0 0)'
  border: 'oklch(0.922 0 0)'
  placeholder: 'oklch(0.556 0 0)'
  secondary-text: 'oklch(0.556 0 0)'
  foreground: 'oklch(0.205 0 0)'
  action-comment: 'oklch(0.637 0.151 230)'
  action-repost: 'oklch(0.637 0.165 160)'
  action-like: 'oklch(0.637 0.22 15)'
  destructive: 'oklch(0.577 0.245 27.325)'
  canvas-dark: 'oklch(0.145 0 0)'
  surface-dark: 'oklch(0.205 0 0)'
  border-dark: 'oklch(1 0 0 / 10%)'
  placeholder-dark: 'oklch(0.708 0 0)'
  foreground-dark: 'oklch(0.922 0 0)'
  destructive-dark: 'oklch(0.704 0.191 22.216)'
typography:
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: '3.75px'
  md: '5px'
  lg: '6.25px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '24px'
  2xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.foreground}'
    textColor: '{colors.canvas}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  button-primary-hover:
    backgroundColor: 'oklch(0.3 0 0)'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.foreground}'
    rounded: '{rounded.full}'
    padding: '8px 16px'
  card:
    backgroundColor: '{colors.canvas}'
    rounded: '{rounded.lg}'
    padding: '16px'
  input:
    backgroundColor: '{colors.canvas}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px 12px'
  nav-button:
    backgroundColor: 'transparent'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px'
  nav-button-active:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px'
---

# Design System: xb

## 1. Overview

**Creative North Star: "The Silent Canvas"**

xb is a reading surface that disappears. The interface holds space for content without competing with it — every pixel serves the feed, every color choice defers to the words and images authored by others. The system rejects the visual noise of Weibo's original interface: no ad slots, no animated banners, no decorative gradients, no competing navigation hierarchies.

The aesthetic philosophy is _restrained neutrality_. Backgrounds are tinted off-whites, not pure white. Text is near-black, not jet black. Borders whisper. Shadows barely exist. The only chromatic moments are functional: a sky-blue reply, an emerald repost, a rose like. These accents appear on interaction, not at rest — the canvas is silent until the reader acts.

This is not a SaaS dashboard. There are no hero metrics, no card grids, no gradient CTAs. It is not Weibo. There are no ad breaks, no trending popups, no cluttered sidebars. It is a reading surface with the discipline of a well-set book page.

**Key Characteristics:**

- Content-first: the feed dominates; chrome is minimal
- Achromatic at rest: all color is reserved for interactive feedback
- Tonal layering: depth through background shade differences, not shadows
- System typography: no custom fonts; the OS native stack provides clarity at all sizes
- Responsive rail layout: navigation collapses from labeled sidebar to icon rail on smaller screens

## 2. Colors: The Neutral Ground

The palette is deliberately achromatic. No brand hue, no accent color at rest. The system uses OKLCH for precise control over lightness independent of hue.

### Primary

There is no primary brand color. The design's identity comes from its restraint, not from a hue.

### Neutral

- **Canvas** (`oklch(1 0 0)`): Page background. Pure white with zero chroma — the lightest point in the system.
- **Surface** (`oklch(0.97 0 0)`): Elevated surfaces — secondary buttons, active nav items, tab backgrounds. A barely-there step above canvas.
- **Border** (`oklch(0.922 0 0)`): All dividers and strokes. Visible but never assertive.
- **Placeholder** (`oklch(0.556 0 0)`): Muted text — timestamps, source labels, secondary descriptions. Recedes without disappearing.
- **Foreground** (`oklch(0.205 0 0)`): Primary text and icon color. Near-black, softer than `#000`.

### Functional Accents

These colors appear only on interactive elements and only on hover/active states. They are never used for backgrounds, borders, or decorative purposes at rest.

- **Comment Blue** (`oklch(0.637 0.151 230)`): Reply button hover. A calm sky blue — inviting, not urgent.
- **Repost Green** (`oklch(0.637 0.165 160)`): Repost button hover. A natural emerald — signals amplification without alarm.
- **Like Rose** (`oklch(0.637 0.22 15)`): Like button hover and active state. A warm rose — the only color that fills (the heart icon), making it the system's most emphatic chromatic moment.
- **Destructive** (`oklch(0.577 0.245 27.325)`): Delete actions, irreversible operations. A red that demands attention.

### Dark Mode

Dark mode inverts the neutral scale. Canvas becomes `oklch(0.145 0 0)`, surface becomes `oklch(0.205 0 0)`, foreground becomes `oklch(0.922 0 0)`. Borders use `oklch(1 0 0 / 10%)` — a white at 10% opacity — instead of a solid gray, keeping the dark surface clean. Functional accents shift slightly lighter for contrast against dark backgrounds.

### Named Rules

**The No-Brand-Color Rule.** There is no primary accent color in the design system. The interface's identity is its absence. Do not introduce a brand hue to "add personality" — personality comes from typography, spacing, and the restraint itself.

**The Interaction-Only Rule.** Chromatic colors (blue, green, rose) appear exclusively on interactive hover/active states. At rest, every surface is achromatic. If a color is visible without user interaction, it's content (images, videos), not UI.

**The Tinted-Neutral Rule.** Never use pure `#000` or `#fff`. The lightest value is `oklch(1 0 0)` (white, zero chroma) and the darkest is `oklch(0.145 0 0)` — both are technically achromatic but the system's grays are all OKLCH-defined, not hex-derived, ensuring consistent perceptual lightness across modes.

## 3. Typography

**Body Font:** system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
**Label Font:** Same stack, smaller size, slightly heavier weight

**Character:** The system uses the operating system's native sans-serif stack. No custom web fonts — the OS font is the fastest to render, the most legible at small sizes, and the most familiar to the user. Chinese text benefits from system fonts that include optimized CJK glyph rendering (PingFang SC on macOS, Microsoft YaHei on Windows).

### Hierarchy

- **Title** (600, 1rem / 16px, line-height 1.4): Author names, section headings, card titles. Semibold weight creates hierarchy without size change.
- **Body** (400, 1rem / 16px, line-height 1.5): Feed text, descriptions, content. The default reading size. Line length capped at ~65ch in feed cards.
- **Label** (500, 0.75rem / 12px, line-height 1.4): Timestamps, source attribution, tab labels, navigation labels. Uppercase not used — Chinese text doesn't benefit from letter-spacing tricks.
- **Caption** (400, 0.75rem / 12px, line-height 1.4): Secondary metadata, region names, version numbers. Same size as label but lighter weight.

### Customization

Users can override font size (sm / base / lg / xl) and font family (sans / serif) via settings. The serif option renders body text in a CJK-friendly serif stack for a more literary reading feel.

### Named Rules

**The System Font Rule.** Never load custom web fonts for the UI chrome. The system font stack renders instantly, handles CJK text natively, and respects the user's OS preferences. Custom fonts are a content-layer concern (user-authored text), not a UI-layer concern.

**The Weight-Over-Size Rule.** Create hierarchy through font-weight contrast (400 → 600) before increasing font size. The title and body share the same 1rem size — weight alone distinguishes them. This keeps the vertical rhythm tight.

## 4. Elevation

The system is flat by default. Depth is conveyed through tonal layering — background shade differences between surfaces — not through shadows. A card sitting on the canvas has no drop shadow; its slight background tint (`surface` vs `canvas`) is enough to separate it visually.

The only shadow in the system is `shadow-sm` (`0 1px 2px 0 oklch(0 0 0 / 0.05)`) — a barely-visible lift used sparingly on the "rewrite paused" floating card. Most components have `shadow-none`.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. No component carries a drop shadow in its default state. The only exception is floating overlays (the paused-state card) that need to visually detach from the page.

**The Tonal-Layering Rule.** Use background shade to indicate elevation, not shadows. Canvas (`oklch(1 0 0)`) is the base layer. Surface (`oklch(0.97 0 0)`) is one step up. If a third level is needed, use `oklch(0.94 0 0)`. Each step is a ~3% lightness reduction.

## 5. Components

### Buttons

Buttons are the primary interactive element. The system defines four variants.

- **Shape:** Gently curved edges (`rounded-md`, 5px radius). Icon-only buttons use full rounding (`rounded-full`).
- **Primary:** Dark background (`foreground`) with light text (`canvas`). Used for the compose action. Padding 8px 16px. Hover darkens slightly (`oklch(0.3 0 0)`).
- **Secondary:** Light background (`surface`) with dark text (`foreground`). Used for settings, theme toggle. Same padding. Hover lightens to `oklch(0.94 0 0)`.
- **Ghost:** Transparent background, dark text. Used for navigation items, action buttons (reply, repost, like). Hover shows `surface` background. Full rounding for action buttons.
- **Size variants:** `default` (h-9, px-4), `icon` (h-9, w-9), `xs` (h-5, px-1.5, text-xs), `sm` (h-8, px-3).
- **Focus:** Ring outline (`oklch(0.708 0 0)` at 50% opacity, 2px offset).
- **Active:** `scale-[0.96]` transform on action buttons for tactile feedback.

### Cards

Cards are the container for feed items and sidebar widgets.

- **Corner Style:** Gently curved (`rounded-lg`, 6.25px radius)
- **Background:** Canvas color — cards sit flat on the page, differentiated by the gap between them, not by background shade
- **Shadow:** None (`shadow-none`). Cards are flat.
- **Border:** Subtle border (`border-border/70` — 70% opacity of the border color)
- **Internal Padding:** Header and footer use `px-4`, content uses `px-4` with `gap-4` vertical spacing
- **Feed Card Structure:** Author header (avatar + name + timestamp) → text content → media (images/video) → optional retweeted quote card → action bar

### Inputs / Fields

- **Style:** Stroke-based with subtle border (`border-input`, `oklch(0.922 0 0)`). Transparent background. Rounded edges (`rounded-md`).
- **Focus:** Ring outline matching the system ring color. Border darkens on focus.
- **Padding:** 8px vertical, 12px horizontal.
- **Search Input:** Full-width with placeholder text in `placeholder` color.

### Navigation

The left rail is the primary navigation. It collapses responsively.

- **Desktop (xl+):** Labeled sidebar, 180px wide. Icons + text labels. Vertical stack with gap-1 between items.
- **Tablet (md+):** Icon-only rail with tooltips on hover. Each button is icon-sized (36px).
- **Active State:** Secondary background (`surface`). Icon and label remain `foreground` color.
- **Hover State:** Ghost background. On the home button, icon swaps from House to RefreshCw to indicate refresh action.
- **Bottom Section:** Settings, rewrite toggle, and theme toggle separated by a subtle top border (`border-border/60`).

### Action Bar

The three-column action bar at the bottom of each feed card.

- **Layout:** Equal three-column grid with gap-2.
- **Style:** Ghost buttons with full rounding, icon + count label.
- **Hover Colors:** Each action has a dedicated chromatic hover: Comment (sky blue), Repost (emerald), Like (rose). Hover applies to both icon and text simultaneously.
- **Active (Like):** The heart icon fills with rose color. The count text also turns rose. This is the only persistent chromatic state in the UI.
- **Interaction Feedback:** `active:scale-[0.96]` on press for tactile response.

### Tabs

- **Style:** Line variant with `bg-muted/60` background and `backdrop-blur` for a frosted effect over scrolling content.
- **Layout:** Equal-width grid (`grid-cols-2`).
- **Position:** Sticky at top of main content area (`sticky top-0 z-10`).
- **Active Indicator:** Bottom border line, not background change.

### Dialogs / Modals

- **Style:** Centered overlay with backdrop. Uses shadcn/ui Dialog primitive.
- **Max Width:** 425px for settings, responsive for other dialogs.
- **Internal Layout:** Vertical stack with gap-6 between field groups. Each field is a horizontal row: label + description on left, control on right.

## 6. Do's and Don'ts

### Do:

- **Do** use OKLCH for all color definitions. The system's perceptual uniformity depends on OKLCH's lightness channel being independent of hue.
- **Do** keep all surfaces achromatic at rest. Color is reserved for interactive feedback only.
- **Do** use `system-ui` font stack. Custom fonts are a performance and consistency liability for a browser extension that overlays on weibo.com.
- **Do** use tonal layering (background shade differences) to indicate elevation, not shadows.
- **Do** maintain the three-column responsive layout: navigation rail → main feed → right sidebar.
- **Do** use `active:scale-[0.96]` on action buttons for tactile press feedback.
- **Do** apply `backdrop-blur` to sticky header elements (tabs) so content scrolls cleanly beneath them.
- **Do** keep the action bar's chromatic hover colors consistent: sky-blue for reply, emerald for repost, rose for like.

### Don't:

- **Don't** introduce a brand accent color. The interface's identity is its restraint. PRODUCT.md's "克制的个性" means the personality comes from what's absent, not from a hue.
- **Don't** use pure `#000` or `#fff` in the UI. Use the OKLCH-defined neutrals which are perceptually calibrated.
- **Don't** add drop shadows to cards or containers. The system is flat by default — this directly rejects Weibo's original layered, shadow-heavy aesthetic.
- **Don't** use gradient text (`background-clip: text` with gradients). Single solid colors only.
- **Don't** use side-stripe borders (`border-left` or `border-right` > 1px as colored accents). This is explicitly prohibited.
- **Don't** load custom web fonts for UI chrome. System fonts render instantly and handle CJK natively.
- **Don't** use glassmorphism as a default treatment. `backdrop-blur` is reserved for sticky headers only.
- **Don't** create identical card grids with icon + heading + text repeated endlessly. PRODUCT.md rejects "传统 SaaS 仪表盘" — the feed is a flowing list, not a dashboard grid.
- **Don't** use modals as the first solution for user flows. Exhaust inline and progressive alternatives first.
- **Don't** animate CSS layout properties. Use `transform` and `opacity` for motion only.
- **Don't** use bounce or elastic easing curves. Use `ease-out` with exponential curves.
