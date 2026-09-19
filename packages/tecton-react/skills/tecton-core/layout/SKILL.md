---
name: layout
description: >
  Page and application structure in Tecton — AppShell, PageHeader, Panel,
  Canvas, ActionBar — and the Overflow/Toolbar system that every Tecton row of
  controls is built on. Load when laying out a screen, building a toolbar, a
  page header, a panel header or a bulk-action bar, or when controls need to
  collapse as the container narrows. Tecton action rows are not plain flex
  rows: they are measured, and they give up space in a fixed order (elastic
  shrink, label collapse, overflow menu, reserve compaction, wrap/scroll).
  Covers wrapping controls in OverflowItem with priority and OverflowLabel,
  which children stay fixed, Toolbar versus Overflow, the one-row-per-host
  rule, and why an icon-only control still needs its label.
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
  - 'tecton-core/tecton-components'
sources:
  - 'rpkapps/tecton-ui-1:docs/OVERFLOW-RULES.md'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/tecton/overflow.mdx'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/tecton/app-shell.mdx'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/tecton/page-header.mdx'
---

# Tecton UI — Layout and action rows

## The frame

```tsx
import {
  AppShell, AppShellBody, AppShellHeader, AppShellMain, AppShellSidebar,
} from "@tecton/react/tecton/app-shell"

;<AppShell>
  <AppShellHeader>
    <AppShellBrand>…</AppShellBrand>
    <AppShellNav>…</AppShellNav>
    <AppShellHeaderActions>…</AppShellHeaderActions>
  </AppShellHeader>
  <AppShellBody>
    <AppShellSidebar>…</AppShellSidebar>
    <AppShellMain>…</AppShellMain>
    <AppShellAside>…</AppShellAside>
  </AppShellBody>
</AppShell>
```

`AppShellSplit`, `AppShellSplitPanel` and `AppShellSplitHandle` give resizable
panes inside `AppShellMain`.

Inside a page: `PageHeader` for the title block, `Panel` for a titled region,
`Canvas` for a map or 3D viewport, `ActionBar` for a contextual selection bar.

```tsx
<PageHeader>
  <PageHeaderContent>
    <PageHeaderEyebrow>Field</PageHeaderEyebrow>
    <PageHeaderTitle>Troll West</PageHeaderTitle>
    <PageHeaderDescription>142 wells · updated 2 hours ago</PageHeaderDescription>
  </PageHeaderContent>
  <PageHeaderActions aria-label="Field actions">…</PageHeaderActions>
</PageHeader>
```

## Action rows are measured, not flexed

`PageHeaderActions`, `PanelActions`, `ActionBarActions`, `ShellActions` and
canvas toolbars are all `Overflow` rows. A row watches its own width and gives
up space in a fixed order:

| Stage | What gives                                                     |
| ----- | -------------------------------------------------------------- |
| 1     | Elastic items (search box, combobox) shrink toward their `min`  |
| 2     | Labels drop — items with icons become icon-only                 |
| 3     | Items move into the overflow menu, lowest `priority` first      |
| 4     | The host's reserve compacts ("12 of 340 selected" → "12")       |
| 5     | Last resort: the row wraps, or scrolls — never both             |

You get all of this by wrapping controls correctly. You get **none** of it
from a `<div className="flex gap-2">`.

## Core patterns

### A toolbar

```tsx
import {
  OverflowDivider, OverflowItem, OverflowLabel, Toolbar,
} from "@tecton/react/tecton/overflow"

;<Toolbar aria-label="Well actions">
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

Three rules do most of the work:

1. **Wrap everything that may leave the row in an `OverflowItem`** with a
   stable `id`, a `label` and an `icon`. The label and icon are what the
   overflow menu renders.
2. **Unwrapped children are fixed** — they never leave. The primary action
   goes in bare, exactly once.
3. **Put label text in `OverflowLabel`** so stage 2 can drop it to icon-only.

`priority` is an integer, default `0`; higher stays in the row longer. It
never reorders anything. `labelBehavior="keep"` opts an item out of label
collapse — use it for destructive actions and any icon that is not
self-explanatory.

The `More` menu renders itself at the end. Do not add one.

### `Toolbar` or `Overflow`?

`Toolbar` is a React Aria toolbar: **one tab stop**, arrow keys move between
visible controls. Use it for a row of actions. Use plain `Overflow` when the
row is not semantically a toolbar — a breadcrumb, a chip row, or any row
containing a tab list (a tab list and a toolbar would fight over the arrow
keys).

### One row per host

A host has one overflow row, never two side by side: two measured rows in one
flex line each see a width that depends on what the other has already
collapsed, and the collapse becomes sticky. Put both groups in the same row
with an `OverflowSpacer` between them and let `priority` decide.

## References

- [The full overflow and collapse contract](references/overflow-rules.md)

## Common Mistakes

### HIGH A plain flex row instead of an overflow row

Wrong:

```tsx
<PageHeaderActions>
  <div className="flex items-center gap-2">
    <Button variant="outline">Share</Button>
    <Button variant="outline">Export</Button>
    <Button>New well</Button>
  </div>
</PageHeaderActions>
```

Correct:

```tsx
<PageHeaderActions aria-label="Field actions">
  <OverflowItem id="share" label="Share" icon={<ShareIcon />}>
    <Button variant="outline">
      <ShareIcon data-icon="inline-start" />
      <OverflowLabel>Share</OverflowLabel>
    </Button>
  </OverflowItem>
  <OverflowItem id="export" label="Export" icon={<ExportIcon />}>
    <Button variant="outline">
      <ExportIcon data-icon="inline-start" />
      <OverflowLabel>Export</OverflowLabel>
    </Button>
  </OverflowItem>
  <Button>New well</Button>
</PageHeaderActions>
```

`PageHeaderActions` *is* the row. Nesting a `div` inside it makes the whole
group one fixed child: the row measures a single unshrinkable block, no item
can ever leave, and stage 5 kicks in immediately — the header wraps to a
second line or clips at the width where it should merely have collapsed a
label. On a dense enterprise screen that is the common width, not the edge
case.

Source: `docs/OVERFLOW-RULES.md § 7.3`, `§ 9.3`

### HIGH An unwrapped control that should collapse

Wrong:

```tsx
<Toolbar aria-label="Canvas">
  <Button variant="outline">Measure</Button>
  <Button variant="outline">Annotate</Button>
  <Button>Run</Button>
</Toolbar>
```

Correct:

```tsx
<Toolbar aria-label="Canvas">
  <OverflowItem id="measure" label="Measure" icon={<MeasureIcon />}>
    <Button variant="outline">
      <MeasureIcon data-icon="inline-start" />
      <OverflowLabel>Measure</OverflowLabel>
    </Button>
  </OverflowItem>
  <OverflowItem id="annotate" label="Annotate" icon={<AnnotateIcon />}>
    <Button variant="outline">
      <AnnotateIcon data-icon="inline-start" />
      <OverflowLabel>Annotate</OverflowLabel>
    </Button>
  </OverflowItem>
  <Button>Run</Button>
</Toolbar>
```

An unwrapped child is a **fixed** item by definition — it never leaves the row
and it must always fit. A toolbar of only fixed items cannot collapse at all,
so it goes straight to wrapping or scrolling. Fixed status is for the primary
action and the dismiss control, not for every button.

Source: `docs/OVERFLOW-RULES.md § 1`, `§ 7.1`

### MEDIUM Adding your own "More" menu

Wrong:

```tsx
<Toolbar aria-label="Actions">
  <OverflowItem id="share" label="Share">…</OverflowItem>
  <DropdownMenuTrigger>
    <Button size="icon" aria-label="More"><MoreIcon /></Button>
    <DropdownMenu>
      <DropdownMenuItem onAction={archive}>Archive</DropdownMenuItem>
    </DropdownMenu>
  </DropdownMenuTrigger>
</Toolbar>
```

Correct:

```tsx
<Toolbar aria-label="Actions">
  <OverflowItem id="share" label="Share">…</OverflowItem>
  <OverflowItem id="archive" label="Archive" icon={<ArchiveIcon />} priority={-1}>
    <Button variant="ghost">
      <ArchiveIcon data-icon="inline-start" />
      <OverflowLabel>Archive</OverflowLabel>
    </Button>
  </OverflowItem>
</Toolbar>
```

The row renders its own overflow menu as soon as an item is hidden, so a
hand-added one gives two `More` buttons at narrow widths. Nothing may exist
only in the menu: every menu entry must correspond to an item that is in the
row at some width. To make an action leave early, give it a low `priority`.

Source: `docs/OVERFLOW-RULES.md § 6.7`, `§ 5.9`

### MEDIUM A `Toolbar` around a tab list

Wrong:

```tsx
<Toolbar aria-label="Sections">
  <TabsList>…</TabsList>
  <Button>New</Button>
</Toolbar>
```

Correct:

```tsx
<Overflow aria-label="Sections">
  <TabsList>…</TabsList>
  <OverflowSpacer />
  <Button>New</Button>
</Overflow>
```

A `Toolbar` and a tab list both claim the arrow keys; nested, they fight and
arrow navigation becomes unpredictable. A row containing a tab list is a plain
`Overflow`. Section tabs also collapse as **one** item, never one tab at a
time — hiding single tabs breaks arrow navigation and can hide the selected
tab.

Source: `docs/OVERFLOW-RULES.md § 15.1`, `§ 15.2`

### MEDIUM An icon-only item with no label

Wrong:

```tsx
<OverflowItem id="zoom">
  <Button size="icon"><ZoomIcon /></Button>
</OverflowItem>
```

Correct:

```tsx
<OverflowItem id="zoom" label="Zoom to fit" icon={<ZoomIcon />}>
  <Button size="icon" aria-label="Zoom to fit">
    <ZoomIcon />
  </Button>
</OverflowItem>
```

`label` and `icon` are what the overflow menu renders when the item leaves the
row. Without them the menu entry is blank, and an icon-only control with no
accessible name is announced as just "button".

Source: `docs/OVERFLOW-RULES.md § 4.4`, `§ 6`

See also: `tecton-core/tecton-components/SKILL.md` — `Panel`, `PageHeader`,
`ActionBar` and the rest of the Tecton frame.
