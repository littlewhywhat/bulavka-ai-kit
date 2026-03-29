# Bulavka AI Kit — Spec Documentation Notes

## Reference Chats

These chats contain the full implementation history, design decisions, bug investigations, and nuances:

- [Folder feature design & impl](ac349954-d6fb-4231-b213-1b4afa6c2516) — initial folder support: storage architecture, tree reconciliation, DnD with pragmatic-drag-and-drop, component extraction, accessibility
- [Increase nesting depth to 3](72036755-4334-4aae-87e5-673afee6b71f) — `MAX_FOLDER_DEPTH` 2→3, recursive tree mutations, depth validation formula, circular drop prevention
- [Folder icon animation states](81bbb675-32a4-4c2d-801e-f041ee05986c) — 3 visual states (sprite/delayed-open/open), Lottie frame extraction, hover suppress after close, indentation cleanup
- [Folder hover bug & active chat](024faac2-7c74-41d1-bb44-daae3eefabcb) — `:focus` persistence on `hoverable` class, `blur()` fix, `data-active` attribute for active conversation, `popstate` URL tracking
- [DnD UX fixes](2d2dfe06-f166-4770-8213-57be074d8657) — curved indicator fix, CSS variable theming, split-tab prevention, `<a>`→`<div>` migration, custom drag preview
- [Double indicator & native drag](a24805e5-34a5-4d51-9b9d-d84981b4a0f1) — double drop line suppression (render only "after" side), capture-phase `dragstart` blocker on `#history`, `draggable={false}` on PinItem
- [Spec documentation planning](a94de227-5f7c-4bd5-ae71-e255915225f8) — analysis of all chats above, initial breakdown of what to document

---

## Documentation Layers

The spec should be organized into layers, each with its own PlantUML diagrams and/or Gherkin feature files depending on what fits best.

### Layer 1: Data Model & Storage

**PlantUML: entity diagrams**

Entities and their relationships:

- `Pin` — `{ conversationId, messageId, preview, pinnedAt }`
- `PinnedChat` — `{ conversationId, title, pinnedAt }`
- `FolderMeta` — `{ id, name, collapsed }`
- `FoldersMap` — `Record<string, FolderMeta>`
- `TreeNode` — discriminated union: `ChatNode { type: "chat", id }` | `FolderNode { type: "folder", id, children: TreeNode[] }`
- `MAX_FOLDER_DEPTH = 3` (root → folder → folder → items)

Storage keys and areas:

| Key | Area | Content | Source of truth for |
|-----|------|---------|---------------------|
| `bulavka-ai-kit-pins` | sync | `Pin[]` (JSON string) | what is pinned |
| `bulavka-ai-kit-pinned-chats` | sync | `PinnedChat[]` (JSON string) | what is favourited |
| `bulavka-ai-kit-favourites-tree` | sync | `TreeNode[]` | ordering & grouping |
| `bulavka-ai-kit-folders` | sync | `FoldersMap` | folder metadata |
| settings (enabled, maxPins, etc.) | local | typed defaults object | user preferences |

Key separation principle: `pinnedChats` is the source of truth for *what* is favourited. The tree describes *ordering and grouping*. Folders store *metadata* (name, collapsed). These three are reconciled but stored independently.

### Layer 2: Messaging & Communication

**PlantUML: sequence diagrams**

Background ↔ Content message flows:

- **Pin flow**: content → `pins-add` → background (enforces `maxPins`) → saves to sync → `onPinsChange` listener updates content UI
- **Unpin flow**: content → `request-show-unpin-modal` → background → `sendToTab` → `show-unpin-modal` → content shows modal → user confirms → content → `pins-remove` → background
- **Favourite flow**: content → `pinned-chats-add` → background (enforces `maxPinnedChats`, may respond with limit modal) → saves to sync → tree reconciliation appends new chat at root
- **Unfavourite flow**: same pattern as unpin — routed through background for modal display
- **Limit modal**: background → `sendToTab` → `show-favourite-limit-modal` → content shows modal

Why modals route through background: the service worker stays headless; confirmation UI must run in the content script context where DOM access exists.

Settings flow: popup → `chrome.storage.local` → content reads via `useSettingsValue` + `onChanged` listener. No messaging needed.

### Layer 3: DOM Integration & Injection

**PlantUML: sequence/activity diagrams**

How the extension injects into ChatGPT's page:

- `inject-pinned-chats-section.ts` — mounts Favourites section above `div#history` via MutationObserver; re-injects if ChatGPT re-renders the sidebar
- `inject-pins-section.ts` — mounts Pinned Replies section similarly
- `inject-pin-button.ts` — observes assistant message toolbars; mounts PinButton inline
- `inject-favourite-menu-item.ts` — observes open Radix menus; injects Add/Remove Favourites row

Host page CSS/DOM dependencies:

- `hoverable` class — ChatGPT's class that applies background on `:hover` AND `:focus`/`:focus-within`
- `__menu-item` class — applies `border-radius` to sidebar items
- `data-active=""` attribute — ChatGPT's native attribute for selected sidebar items
- `data-sidebar-item="true"` — ChatGPT uses this for drag/focus delegation
- Sprite: `<use href="/cdn/assets/sprites-core-*.svg#61ee0c">` — closed folder icon reused from ChatGPT's assets
- `var(--text-accent)`, `var(--bg-primary)` — ChatGPT's CSS variables used for DnD indicators and drag preview

Native drag interference:

- Capture-phase `dragstart` listener on `div#history` with `stopImmediatePropagation()` — prevents ChatGPT's native drag handler from running on extension elements (would cause opacity/title-hide glitch)
- `PinItem` `<a>` tags get `draggable={false}` — same pattern ChatGPT uses on its own pinned items

### Layer 4: UI Components

**PlantUML: component diagram**

```
PinnedChatsSection (orchestrator)
├── Section header with "+" folder button (hover to show)
├── Tree rendering (recursive):
│   ├── ChatNode → PinnedChatItem
│   │   ├── <div> (not <a>) with click → navigateToPath()
│   │   ├── data-active="" when matches activeConversationId
│   │   ├── DnD: draggable + drop target (2-zone: top/bottom at 50%/50%)
│   │   └── Custom drag preview (matching width, border-radius, bg-primary, 0.9 opacity)
│   └── FolderNode → FolderRow
│       ├── Folder header (chevron toggle, DnD, rename/delete context menu)
│       ├── Folder icon: 3 visual states (sprite → delayed-open → open)
│       ├── Item count badge (shown when collapsed)
│       ├── DnD: draggable + drop target (3-zone: top 25% / center 50% / bottom 25%)
│       ├── Custom drag preview
│       └── Children container (paddingLeft: 20px per level)
│           ├── PinnedChatItem[]
│           └── FolderRow[] (recursive, up to MAX_FOLDER_DEPTH)
├── "More / Show less" (root level only — counts root folders + root chats)
└── DnD Monitor (monitorForElements — handles drop events, computes new tree, persists)

PinsSection
├── Section header
├── PinItem[] (<a> to /branch/{conversationId}/{messageId}, draggable={false})
└── "More / Show less"
```

### Layer 5: Tree Reconciliation

**Gherkin: feature file + PlantUML: activity diagram**

Core reconciliation rules:
- Chat exists in `pinnedChats` but not in tree → append at root
- Chat exists in tree but removed from `pinnedChats` → prune from tree
- Empty folders persist until explicitly deleted
- Only save tree if it actually changed (prevents infinite loops)

Race condition handling:
- `onPinnedChatsChange` and `onTreeChange` fire independently from `chrome.storage.sync`
- A `loaded` flag ensures reconciliation waits for both data sources before proceeding
- State updates come solely from the `onTreeChange` storage listener (not from reconcile return value) — prevents double renders
- DnD monitor reads from module-level `getTree()` cache (not React state closure) — prevents stale closure bugs

### Layer 6: Folder Management

**Gherkin: feature files**

Folder lifecycle:
- Create: "+" button → new folder at root with inline rename active
- Rename: context menu → inline text input
- Delete: children promoted to root at folder's former position
- Collapse/expand: click header; state persisted per-folder in sync storage
- Item count badge shown when collapsed

Folder icon states:
- Collapsed (no hover): ChatGPT native sprite via `<use>` tag
- Collapsed + hover ("delayed-open"): Lottie-derived SVG with gentle skew transforms (slightly ajar folder)
- Expanded: Lottie-derived SVG with full 3D perspective transforms
- Instant swap between states (no CSS animation)
- **Suppress hover after close**: when clicking to close, `suppressHover` ref blocks `onMouseEnter`; resets on `onMouseLeave`

Focus bug:
- Clicking folder header gives it `:focus` via `tabIndex={0}`; ChatGPT's `hoverable` class persists background
- Fix: `blur()` after mouse-click toggle; keyboard Enter toggle does NOT blur (preserves keyboard navigation)

### Layer 7: Drag and Drop

**Gherkin: feature files (lots of edge cases)**

Zone detection:
- `FolderRow`: 25% top → "before", 50% center → "into", 25% bottom → "after"
- `PinnedChatItem`: 50% top → "top", 50% bottom → "bottom"

Basic operations:
- Reorder chats at root
- Reorder folders at root
- Reorder chats within a folder
- Move chat into folder (center zone)
- Move chat out of folder to root
- Drop into collapsed folder (items go to end of children)

Nesting validation (`MAX_FOLDER_DEPTH = 3`):
- Depth formula for "into" drops: `targetDepth + 1 + getFolderDepth(source) < MAX_FOLDER_DEPTH`
- Depth formula for "before/after" drops: `targetDepth + getFolderDepth(source) < MAX_FOLDER_DEPTH`
- `sourceFolderDepth` carried in drag payload data for cross-component validation
- `getFolderDepth(node)` computes how many folder levels a subtree contains

Constraints:
- Self-drop blocked (can't drop item on itself)
- Circular reference prevention: `containsNode` recursive check prevents dropping a folder onto its own descendant (removal before insertion would cause node to vanish)

Visual feedback:
- Drop indicator: absolutely-positioned 2px `<div>` using `var(--text-accent)` color (not `boxShadow` — avoids inheriting `border-radius` curve from `__menu-item`)
- Only "after"/"bottom" indicator rendered (never "before"/"top") — prevents double indicator lines between adjacent items
- "Into" drop: light blue background tint (8% of `var(--text-accent)`)
- Dragged item: reduced opacity
- Custom drag preview: `setCustomNativeDragPreview` with matching width, `border-radius: 10px`, `var(--bg-primary)` background, 0.9 opacity, `preserveOffsetOnSource` using `location.initial.input`

Browser integration:
- `preventUnhandled.start()` in DnD monitor's `onDragStart` — blocks browser default drag outside drop targets
- `PinnedChatItem` is `<div>` not `<a>` — eliminates browser link-drag semantics (split-tab, green + cursor, URL drag data)
- `PinItem` `<a>` tags: `draggable={false}` — prevents native drag
- Capture-phase `dragstart` on `div#history`: `stopImmediatePropagation` + `preventDefault` — prevents ChatGPT's native drag from targeting extension elements

### Layer 8: Active Chat Highlight

**Gherkin: feature file**

- `activeConversationId` state in `PinnedChatsSection` from `getConversationIdFromUrl()`
- `popstate` event listener detects URL changes (extension's `navigateToPath` dispatches `popstate` after `history.pushState`)
- Active item gets `data-active=""` (same as ChatGPT's native active chat attribute)
- Prop threaded through `FolderRow` → nested `PinnedChatItem`
- **Known limitation**: ChatGPT's internal Next.js navigation uses `pushState` without dispatching `popstate` — active state won't update on native sidebar clicks

### Layer 9: Settings & Popup

**Gherkin: feature file**

- Global enable/disable
- Toggle section visibility (Favourites, Pinned Replies)
- Max items: 1-25, constrained so max >= current stored count
- Initial visible count
- Popup is React 19 + Radix UI (separate from content script's Preact)
- Settings stored in `chrome.storage.local`
- Content script reads via `useSettingsValue` + `onChanged` listener

### Layer 10: Show More / Show Less

**Gherkin: feature file**

- Applies at root level only
- Counts root-level folders + root-level ungrouped chats
- Items nested inside folders are unaffected by the limit
- Controlled by `initialPinnedChatsVisible` / `initialPinsVisible` settings

---

## What to write next

### PlantUML diagrams (`spec/diagram/`)

| File | Layer | Type | Content |
|------|-------|------|---------|
| `entities.puml` | 1 | entity diagram | Pin, PinnedChat, FolderMeta, TreeNode, storage keys |
| `messaging.puml` | 2 | sequence diagram | pin/unpin/favourite/unfavourite/limit flows between content ↔ background |
| `injection.puml` | 3 | activity diagram | how content scripts inject into ChatGPT DOM, MutationObserver lifecycle |
| `components.puml` | 4 | component diagram | sidebar component tree, popup component tree |
| `reconciliation.puml` | 5 | activity diagram | tree reconciliation flow, race condition guards |
| `dnd-zones.puml` | 7 | state diagram | zone detection model for FolderRow (3-zone) and PinnedChatItem (2-zone) |
| `dnd-validation.puml` | 7 | activity diagram | depth validation, circular reference check, moveNode flow |

### Gherkin features (`spec/features/`)

| File | Layers | Content |
|------|--------|---------|
| `favourite-chats.feature` | 1,2 | add/remove favourite, limit enforcement, modal flow |
| `pin-replies.feature` | 1,2 | add/remove pin, limit, rename preview, deep link |
| `folders.feature` | 6 | create, rename, delete (children promoted), collapse/expand, icon states, hover suppress, focus fix |
| `tree-reconciliation.feature` | 5 | sync between pinnedChats and tree, prune/append rules, empty folder persistence |
| `dnd-reorder.feature` | 7 | basic reorder of chats and folders at root and within folders |
| `dnd-nesting.feature` | 7 | move into/out of folder, collapsed folder drop, depth validation, circular drop prevention |
| `dnd-visual.feature` | 7 | indicator rendering (only after side), curved line fix, theming, custom drag preview |
| `dnd-browser.feature` | 7 | split-tab prevention, native drag blocking, PinItem non-draggable |
| `active-chat.feature` | 8 | URL tracking, data-active attribute, popstate limitation |
| `settings.feature` | 9 | popup controls, max/initial visible, section toggles |
| `show-more-less.feature` | 10 | root-level pagination, folder contents excluded from count |
