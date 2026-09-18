# Overflow

A row of controls that collapses in stages when its container gets narrow: labels drop to icons, then items move into a More menu. Toolbar is the same row with arrow-key navigation.

Source: /docs/tecton/overflow.md

**Example — `overflow-demo`**

```tsx
"use client"

import {
  ArchiveIcon,
  CopyIcon,
  DownloadIcon,
  PlusIcon,
  ShareIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  OverflowDivider,
  OverflowItem,
  OverflowLabel,
  Toolbar,
} from "@tecton/react/tecton/overflow"

export default function OverflowDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      {/* Drag the corner: the row collapses labels first, then moves items into the More menu. */}
      <div className="min-w-40 resize-x overflow-hidden rounded-md border p-2">
        <Toolbar aria-label="Well actions">
          <OverflowItem
            id="tag"
            label="Add tag"
            icon={<TagIcon />}
            priority={2}
          >
            <Button variant="outline">
              <TagIcon data-icon="inline-start" />
              <OverflowLabel>Add tag</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            id="share"
            label="Share"
            icon={<ShareIcon />}
            priority={1}
          >
            <Button variant="outline">
              <ShareIcon data-icon="inline-start" />
              <OverflowLabel>Share</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="copy" label="Duplicate" icon={<CopyIcon />}>
            <Button variant="outline">
              <CopyIcon data-icon="inline-start" />
              <OverflowLabel>Duplicate</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="export" label="Export" icon={<DownloadIcon />}>
            <Button variant="outline">
              <DownloadIcon data-icon="inline-start" />
              <OverflowLabel>Export</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="archive" label="Archive" icon={<ArchiveIcon />}>
            <Button variant="outline">
              <ArchiveIcon data-icon="inline-start" />
              <OverflowLabel>Archive</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowDivider />
          <OverflowItem
            id="delete"
            label="Delete"
            icon={<Trash2Icon />}
            variant="destructive"
            labelBehavior="keep"
          >
            <Button variant="destructive">
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </OverflowItem>
          {/* Unwrapped: the primary action never leaves the row. */}
          <Button>
            <PlusIcon data-icon="inline-start" />
            New well
          </Button>
        </Toolbar>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the corner to resize.
      </p>
    </div>
  )
}
```

## Usage

```tsx
import {
  Toolbar,
  Overflow,
  OverflowItem,
  OverflowLabel,
  OverflowDivider,
  OverflowSpacer,
  OverflowGroup,
  OverflowMenu,
} from "@tecton/react/tecton/overflow"
```

```tsx
<Toolbar aria-label="Well actions">
  <OverflowItem id="share" label="Share" icon={<ShareIcon />} priority={1}>
    <Button variant="outline">
      <ShareIcon data-icon="inline-start" />
      <OverflowLabel>Share</OverflowLabel>
    </Button>
  </OverflowItem>
  <OverflowDivider />
  <OverflowItem id="delete" label="Delete" variant="destructive" labelBehavior="keep">
    <Button variant="destructive">Delete</Button>
  </OverflowItem>
  <Button>New well</Button>
</Toolbar>
```

Wrap every control that may leave the row in an `OverflowItem`. Unwrapped children are fixed: they never leave, so the primary action goes in bare. Put the label text in an `OverflowLabel` so it can drop to icon-only. The `More` menu is rendered at the end automatically.

> `Toolbar` is a React Aria toolbar: one tab stop, arrow keys move between the visible controls. Use `Overflow` when the row is not a toolbar semantically (a breadcrumb, a chip row). Both need their items and dividers as direct children.

## Stages

The row gives up space one stage at a time and takes it back in reverse. The full contract, including the tie-break, group and focus rules, is in `docs/OVERFLOW-RULES.md` in the repository.

| Stage | What gives |
| --- | --- |
| 1 | Elastic items shrink to their minimum. |
| 2 | Labels drop; items with an icon become icon-only with a tooltip. Items with `labelBehavior="keep"` and text-only items stay as they are. |
| 3 | Items move into the More menu, lowest `priority` first, ties from the end of the row inward. |
| 4 | The host compacts its own summary (see [Action Bar](/docs/tecton/action-bar.md)). |
| 5 | Fixed items alone do not fit: the row wraps (`lastResort="wrap"`, default) or scrolls. |

Stage 2 collapses every label at once and brings them back only when every item fits again with its label, so the row never flickers between the two. Stage 3 is the only stage that moves items; nothing is ever reordered.

## Priority

`priority` decides who leaves first, never where an item sits. The menu keeps source order. `labels="always"` skips the icon-only stage.

**Example — `overflow-priority`**

```tsx
"use client"

import { BellIcon, PinIcon, StarIcon, UserPlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  OverflowItem,
  OverflowLabel,
  Toolbar,
} from "@tecton/react/tecton/overflow"

export default function OverflowPriority() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="min-w-40 resize-x overflow-hidden rounded-md border p-2">
        {/* labels="always": items keep their text and go straight to the menu. */}
        <Toolbar aria-label="Well toolbar" labels="always">
          <OverflowItem
            id="assign"
            label="Assign"
            icon={<UserPlusIcon />}
            priority={3}
          >
            <Button variant="outline">
              <UserPlusIcon data-icon="inline-start" />
              <OverflowLabel>Assign</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            id="watch"
            label="Watch"
            icon={<BellIcon />}
            priority={2}
          >
            <Button variant="outline">
              <BellIcon data-icon="inline-start" />
              <OverflowLabel>Watch</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="star" label="Star" icon={<StarIcon />} priority={1}>
            <Button variant="outline">
              <StarIcon data-icon="inline-start" />
              <OverflowLabel>Star</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="pin" label="Pin" icon={<PinIcon />}>
            <Button variant="outline">
              <PinIcon data-icon="inline-start" />
              <OverflowLabel>Pin</OverflowLabel>
            </Button>
          </OverflowItem>
        </Toolbar>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the corner: Pin leaves first, Assign last.
      </p>
    </div>
  )
}
```

## Other controls

Each item declares what it becomes in the menu with `overflow`. A button needs nothing: its menu item is built from `label`, `icon`, `shortcut` and `onAction`, and `onAction` is injected into the React Aria `Button` child, so the handler is passed once. Other controls pass their own menu form:

| Control | Overflow form |
| --- | --- |
| Toggle | `DropdownMenuGroup selectionMode="multiple"` with one item |
| Dropdown trigger | `DropdownMenuSub` with the same items |
| Select | `DropdownMenuSub` with a single-selection group |
| Text input | `DropdownMenuItem` that opens a `Dialog` holding the same input |
| Anything else | Any menu content, or `overflow="never"` to keep it fixed |

An input is usually `elastic`: it shrinks between `min` and `max` before any label collapses. A dropdown trigger keeps its label (`labelBehavior="keep"`) so the chevron makes sense; wrap its button in a `TooltipTrigger` yourself if you want a tooltip. An item whose own menu or popover is open is not hidden until it closes.

**Example — `overflow-forms`**

```tsx
"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  DownloadIcon,
  EyeIcon,
  FilterIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@tecton/react/components/dialog"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Input } from "@tecton/react/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Toggle } from "@tecton/react/components/toggle"
import {
  OverflowDivider,
  OverflowGroup,
  OverflowItem,
  OverflowLabel,
  Toolbar,
} from "@tecton/react/tecton/overflow"

const fields = ["All fields", "Gullfaks", "Statfjord", "Snorre"]
const formats = ["CSV", "Excel", "PDF"]

export default function OverflowForms() {
  const [query, setQuery] = React.useState("")
  const [field, setField] = React.useState("All fields")
  const [preview, setPreview] = React.useState(true)
  const [searchOpen, setSearchOpen] = React.useState(false)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="min-w-40 resize-x overflow-hidden rounded-md border p-2">
        <Toolbar aria-label="List tools">
          {/* Elastic: shrinks before anything collapses; its menu form opens a dialog with the same input. */}
          <OverflowItem
            id="search"
            priority={3}
            elastic={{ min: "8rem", max: "20rem" }}
            overflow={
              <DropdownMenuItem
                id="search"
                onAction={() => setSearchOpen(true)}
              >
                <SearchIcon />
                Search…
              </DropdownMenuItem>
            }
          >
            <Input
              aria-label="Search wells"
              placeholder="Search wells"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </OverflowItem>

          {/* A select overflows into a submenu with radio items. */}
          <OverflowItem
            id="field"
            priority={2}
            overflow={
              <DropdownMenuSub>
                <DropdownMenuSubTrigger id="field">
                  <FilterIcon />
                  Field
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuGroup
                    selectionMode="single"
                    selectedKeys={[field]}
                    onSelectionChange={(keys) =>
                      setField(String([...keys][0] ?? "All fields"))
                    }
                  >
                    {fields.map((item) => (
                      <DropdownMenuItem key={item} id={item}>
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            }
          >
            <Select
              aria-label="Field"
              selectedKey={field}
              onSelectionChange={(key) => setField(String(key))}
              className="w-36"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map((item) => (
                  <SelectItem key={item} id={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OverflowItem>

          <OverflowDivider />

          {/* A toggle overflows into a checkbox item. */}
          <OverflowItem
            id="preview"
            priority={1}
            overflow={
              <DropdownMenuGroup
                selectionMode="multiple"
                selectedKeys={preview ? ["preview"] : []}
                onSelectionChange={(keys) =>
                  setPreview(keys === "all" || keys.has("preview"))
                }
              >
                <DropdownMenuItem id="preview">
                  <EyeIcon />
                  Preview pane
                </DropdownMenuItem>
              </DropdownMenuGroup>
            }
          >
            <Toggle
              variant="outline"
              aria-label="Preview pane"
              isSelected={preview}
              onChange={setPreview}
            >
              <EyeIcon />
            </Toggle>
          </OverflowItem>

          {/* A dropdown keeps its label and chevron; it overflows into a submenu. */}
          <OverflowGroup id="export" label="Export">
            <OverflowItem
              id="export"
              labelBehavior="keep"
              overflow={
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger id="export">
                    <DownloadIcon />
                    Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {formats.map((format) => (
                      <DropdownMenuItem key={format} id={format}>
                        {format}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              }
            >
              <DropdownMenuTrigger>
                <Button variant="outline">
                  <DownloadIcon data-icon="inline-start" />
                  <OverflowLabel>Export</OverflowLabel>
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuLabel>Format</DropdownMenuLabel>
                  {formats.map((format) => (
                    <DropdownMenuItem key={format} id={format}>
                      {format}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenu>
              </DropdownMenuTrigger>
            </OverflowItem>
          </OverflowGroup>
        </Toolbar>
      </div>
      <Dialog
        isOpen={searchOpen}
        onOpenChange={setSearchOpen}
        className="sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle>Search wells</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          aria-label="Search wells"
          placeholder="Search wells"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Dialog>
      <p className="text-xs text-muted-foreground">
        Drag the corner to resize. {field}
        {query ? ` · "${query}"` : ""}
        {preview ? " · preview on" : ""}
      </p>
    </div>
  )
}
```

A divider stays as long as something is visible on both sides of it and leaves once one side is empty; in the menu it becomes a separator between two hidden neighbours. `OverflowGroup` renders its hidden members as a labelled menu section; `collapse="together"` moves the whole group at once.

## Vertical

`orientation="vertical"` lays the row out as a column and measures heights instead of widths: items leave from the bottom, the More menu sits at the bottom and opens to the side. A tool rail is icon-only already, so give it `labels="never"` and the tooltips show the labels from the start.

**Example — `overflow-vertical`**

```tsx
"use client"

import * as React from "react"
import {
  HandIcon,
  MousePointer2Icon,
  PencilIcon,
  RulerIcon,
  ShapesIcon,
  TypeIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@tecton/react/components/dropdown-menu"
import { Toggle } from "@tecton/react/components/toggle"
import {
  OverflowDivider,
  OverflowItem,
  OverflowSpacer,
  Toolbar,
} from "@tecton/react/tecton/overflow"

const tools = [
  { id: "select", label: "Select", icon: MousePointer2Icon, priority: 3 },
  { id: "pan", label: "Pan", icon: HandIcon, priority: 2 },
  { id: "draw", label: "Draw", icon: PencilIcon, priority: 1 },
  { id: "shape", label: "Shape", icon: ShapesIcon },
  { id: "text", label: "Text", icon: TypeIcon },
  { id: "measure", label: "Measure", icon: RulerIcon },
]

export default function OverflowVertical() {
  const [tool, setTool] = React.useState("select")

  return (
    <div className="flex flex-col gap-2">
      {/* Drag the bottom edge: a vertical row measures heights, and the More
          menu sits at the bottom and opens to the side. */}
      <div className="h-80 min-h-32 w-fit resize-y overflow-hidden rounded-md border p-1">
        <Toolbar
          aria-label="Tools"
          orientation="vertical"
          labels="never"
          className="h-full"
        >
          {/* The tools are one single-selection group: each becomes a radio item in the menu. */}
          {tools.map(({ id, label, icon: Icon, priority }) => (
            <OverflowItem
              key={id}
              id={id}
              label={label}
              priority={priority}
              overflow={
                <DropdownMenuGroup
                  selectionMode="single"
                  selectedKeys={[tool]}
                  onSelectionChange={(keys) => {
                    const next = [...keys][0]
                    if (next) setTool(String(next))
                  }}
                >
                  <DropdownMenuItem id={id}>
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              }
            >
              <Toggle
                aria-label={label}
                isSelected={tool === id}
                onChange={() => setTool(id)}
              >
                <Icon />
              </Toggle>
            </OverflowItem>
          ))}
          <OverflowDivider />
          <OverflowSpacer />
          {/* Unwrapped: the zoom buttons never leave the rail. */}
          <Button variant="ghost" size="icon" aria-label="Zoom in">
            <ZoomInIcon />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Zoom out">
            <ZoomOutIcon />
          </Button>
        </Toolbar>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the bottom edge to resize. Tool: {tool}
      </p>
    </div>
  )
}
```

## Cost

One `ResizeObserver` per row observes the row and its direct children. Sizes are cached per element, hidden items keep their last size and are not measured again, and the visible set lives in a store outside React. Each pass is one walk over the row: a running total is reduced as items are hidden, so cost grows linearly with the number of items. Each item subscribes to its own visibility and the menu to the hidden list, so a resize that hides two items re-renders those two and the menu. A resize that changes nothing notifies nobody. Hidden items stay mounted (`display: none`), so their state survives, and the More menu reads their menu forms only when it opens, so a hidden item re-rendering costs nothing while the menu is closed.

## API Reference

### Toolbar, Overflow

`Toolbar` is a React Aria `Toolbar` (give it an `aria-label`); `Overflow` is a `div`. Both accept:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | "horizontal" | Axis of the row; a vertical row measures heights. |
| `labels` | `"auto" \| "always" \| "never"` | "auto" | `auto` collapses labels before hiding items; `always` keeps them; `never` is icon-only from the start. |
| `minimumVisible` | `number` | 0 | Items kept in the row regardless of width. |
| `lastResort` | `"wrap" \| "scroll"` | "wrap" | What happens when fixed items alone do not fit. A vertical row always scrolls. |
| `menu` | `boolean` | true | Render the trailing `OverflowMenu`; pass `false` to place one yourself. |

### OverflowItem

A `div` wrapper around one control. Must be a direct child of the row.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | - | Stable id, also the key of the menu item. |
| `priority` | `number` | 0 | Higher stays in the row longer. |
| `label` | `string` | - | Menu item text, tooltip, and the accessible name while icon-only. |
| `icon` | `ReactNode` | - | Icon of the menu item. |
| `shortcut` | `ReactNode` | - | Shortcut hint of the menu item. |
| `onAction` | `() => void` | - | Handler of the default menu item; also injected into a React Aria `Button` child. |
| `isDisabled` | `boolean` | - | Disables the child button and the menu item. |
| `variant` | `"default" \| "destructive"` | "default" | Menu item variant. |
| `labelBehavior` | `"collapse" \| "keep"` | "collapse" when `label` is set | Whether the label drops to icon-only. |
| `tooltip` | `boolean` | `labelBehavior === "collapse"` | Show `label` as a tooltip while icon-only. |
| `elastic` | `boolean \| { min?: string; max?: string }` | - | Shrink between these inline sizes before anything collapses (`12rem` to `100%` by default). |
| `overflow` | `ReactNode \| "never"` | - | Menu form; `"never"` makes the item fixed. Omit for a button. |

### OverflowLabel

A `span` for the label text of an item; visually hidden while the row is icon-only.

### OverflowDivider

A `Separator` across the row, hidden once nothing visible remains on one side of it.

### OverflowSpacer

A zero-cost flexible space. Items before it sit at the start of the row, items after it at the end. Like a divider, it leaves once one side of it is empty.

### OverflowGroup

Renders no element. `id`, optional `label` (menu section heading) and `collapse` (`"individually"` or `"together"`).

### OverflowMenu

The trailing More button and its menu. Rendered automatically unless the row has `menu={false}`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | "More actions" | Accessible name of the default trigger. |
| `trigger` | `ReactNode` | - | A custom trigger button instead of the ellipsis. |

### useIsOverflowItemVisible(id)

Returns whether the item is currently in the row.
