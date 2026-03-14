# Browser Extension Template

## Stack

TypeScript (strict), pnpm, CRXJS (Vite), Chrome Manifest V3. Popup: React + Radix Themes. Content: Preact + Tailwind. Background: Effect. Lint/format: Biome.

## Key Principles

### Architecture: Two Isolated Worlds

- `extension/` (background + popup) and `content/` are completely separate sandboxes
- `types/` is the only bridge — pure TypeScript type definitions, zero runtime code
- `extension/` imports from `extension/shared/` and `types/`
- `content/` imports from `content/`, `common/` and `types/`
- No cross-imports between `extension/` and `content/`

### Folder Structure

```
src/
├── common/                     # reusable utilities (not extension-specific)
│   ├── content/
│   │   ├── inline/             # DOM observer, visibility, mount
│   │   ├── floating/           # mount, drag
│   │   └── messaging
│   └── extension/
│       ├── messaging
│       └── storage
├── extension/                   # background, popup, shared
├── content/                     # extension-specific logic
│   ├── inline/                 # inject logic, components
│   └── floating/               # overlay lifecycle, components
└── types/
```

- `common/` — generic messaging, storage, DOM helpers. No message/schema types.
- `content/` — extension-specific: inject logic, overlay lifecycle, components.
- Message types in `types/`. Extension wrappers pass them to common factories.

### Dependency Boundaries

- `types/` — no framework imports, no dependencies. Pure TypeScript
- `extension/shared/` — shared between background and popup only. No React, no Effect
- `extension/background/` — Effect for business logic. Heavy deps stay here
- `extension/popup/` — React + Radix Themes. Self-contained
- `content/` — Preact + Tailwind. Lightweight, never imports from `extension/`

### Content Script Weight Matters

- Content scripts are injected into every matching page — bundle size directly affects user experience
- Preact (~3KB) over React (~40KB) for content scripts
- Tailwind (tree-shaken, only used classes) for floating UI in Shadow DOM
- Background and popup have zero size constraints — load once, not per-page

### Two Content Script Rendering Modes

- **Inline** — Preact rendered directly into host DOM, no style isolation, reuses host page CSS classes. For buttons, badges, annotations that blend in
- **Floating** — Preact + Tailwind inside Shadow DOM. Style isolation from host page. For sidebars, overlays, draggable panels that sit on top

### Shadow DOM for Floating, No Shadow DOM for Inline

- Floating overlays are self-contained UI — need style isolation so host page can't break them
- Inline injections deliberately inherit host page styles to blend in
- Tailwind CSS injected into shadow root via Vite `?inline` import

### Common Utilities

- `observe(config)` — MutationObserver + initial scan, `onElement` callback, `markerAttr` for dedup
- `onVisible(el, callback)` — IntersectionObserver, defers mount until visible (compose with `observe` when needed)
- `mountInline(container, vnode)` — one-shot render, returns `{ dispose }`
- `mountFloating(vnode, hostStyles, shadowStyles?)` — creates host + shadow, returns `{ host, shadow, dispose }`. Caller provides host styles; optional `shadowStyles` for Tailwind.
- `setupDrag(host, handleRoot, options?)` — drag via `[data-drag-handle]` (or custom selector). Returns `dispose` for cleanup. Call `disposeDrag()` before mount `dispose` when closing.

### Inject Pattern

- `content/inline/` — observe + mount logic, called from content entry. Example: Weather button next to search form.

## Build

`pnpm dev` — Vite dev server with CRXJS HMR. `pnpm build` — production build to `dist/`.
