# Page Header

Page title block with optional eyebrow, description, section tabs and trailing actions.

Source: /docs/tecton/page-header.md

**Example — `page-header-demo`**

```tsx
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

export default function PageHeaderDemo() {
  return (
    <PageHeader className="w-full max-w-2xl">
      <PageHeaderContent>
        <PageHeaderTitle>Gullfaks field development</PageHeaderTitle>
        <PageHeaderDescription>
          Three alternatives evaluated against the P50 volumes from the 2025 reservoir model.
        </PageHeaderDescription>
      </PageHeaderContent>
    </PageHeader>
  )
}
```

## Usage

```tsx
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderNav,
  PageHeaderActions,
} from "@tecton/react/tecton/page-header"
```

```tsx
<PageHeader>
  <PageHeaderContent>
    <PageHeaderEyebrow>Gullfaks / Wells</PageHeaderEyebrow>
    <PageHeaderTitle>34/10-A-12</PageHeaderTitle>
    <PageHeaderDescription>Drilled 2019 · TD 3 250 m</PageHeaderDescription>
  </PageHeaderContent>
  <PageHeaderActions>
    <Button>New well</Button>
  </PageHeaderActions>
</PageHeader>
```

## Composition

Use the following composition:

```text
PageHeader
├── PageHeaderContent
│   ├── PageHeaderEyebrow
│   ├── PageHeaderTitle
│   └── PageHeaderDescription
└── PageHeaderActions
```

## Actions

`PageHeaderActions` is an [Overflow](/docs/tecton/overflow.md) row at the end of the header. Wrap secondary actions in `OverflowItem`: when the header is narrow their labels drop to icons, then they move into a More menu, lowest priority first. Leave the primary action unwrapped so it never leaves. The content keeps its natural width up to 60% of the header and the actions get the rest. The header is a single row at every width: because the actions collapse, it never needs to stack.

**Example — `page-header-actions`**

```tsx
import { DownloadIcon, PlusIcon, SettingsIcon, ShareIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { OverflowItem, OverflowLabel } from "@tecton/react/tecton/overflow"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

export default function PageHeaderActionsExample() {
  return (
    <div className="w-full max-w-2xl min-w-64 resize-x overflow-hidden rounded-md border p-4">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Wells</PageHeaderTitle>
          <PageHeaderDescription>
            23 wells across 4 fields.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          {/* Secondary actions collapse into the More menu when the header is narrow. */}
          <OverflowItem id="settings" label="Settings" icon={<SettingsIcon />}>
            <Button variant="ghost">
              <SettingsIcon data-icon="inline-start" />
              <OverflowLabel>Settings</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            id="export"
            label="Export"
            icon={<DownloadIcon />}
            priority={1}
          >
            <Button variant="outline">
              <DownloadIcon data-icon="inline-start" />
              <OverflowLabel>Export</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            id="share"
            label="Share"
            icon={<ShareIcon />}
            priority={2}
          >
            <Button variant="outline">
              <ShareIcon data-icon="inline-start" />
              <OverflowLabel>Share</OverflowLabel>
            </Button>
          </OverflowItem>
          {/* Unwrapped: the primary action never leaves the row. */}
          <Button>
            <PlusIcon data-icon="inline-start" />
            New well
          </Button>
        </PageHeaderActions>
      </PageHeader>
    </div>
  )
}
```

## Section tabs

`PageHeaderNav` holds the section tabs. Between the title and the actions it keeps its natural width and never collapses. To let the tabs collapse, put the nav inside `PageHeaderActions` as an `OverflowItem` with a `priority`, followed by an `OverflowSpacer` and then the actions: everything is then one overflow row, and the tabs move into the More menu as a single-selection section, all at once, when their priority is reached. Tabs never collapse one by one, so arrow-key navigation and the selected tab stay intact.

In the example the view toggle has priority 1 and the tabs priority 2, so as the header narrows the toggle goes first and the tabs second.

**Example — `page-header-nav`**

```tsx
"use client"

import * as React from "react"
import { ListIcon, WaypointsIcon } from "lucide-react"

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@tecton/react/components/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import { OverflowItem, OverflowSpacer } from "@tecton/react/tecton/overflow"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderNav,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

const sections = [
  { id: "overview", label: "Overview" },
  { id: "framing", label: "Framing" },
  { id: "team", label: "Team" },
  { id: "builder", label: "Builder" },
]

export default function PageHeaderNavDemo() {
  const [section, setSection] = React.useState("overview")
  const [view, setView] = React.useState("list")

  return (
    <div className="w-full max-w-3xl min-w-72 resize-x overflow-hidden rounded-md border p-4">
      <PageHeader className="items-center">
        <PageHeaderContent className="flex-none">
          <PageHeaderTitle className="text-xl">Orion</PageHeaderTitle>
        </PageHeaderContent>
        {/* One overflow row: tabs at the start, toggle at the end. The toggle
            (priority 1) moves into the More menu first, the tabs (priority 2)
            second, all at once as a section list. */}
        <PageHeaderActions>
          <OverflowItem
            id="sections"
            priority={2}
            overflow={
              <DropdownMenuGroup
                selectionMode="single"
                selectedKeys={[section]}
                onSelectionChange={(keys) => {
                  const next = [...keys][0]
                  if (next) setSection(String(next))
                }}
              >
                <DropdownMenuLabel>Section</DropdownMenuLabel>
                {sections.map((item) => (
                  <DropdownMenuItem key={item.id} id={item.id}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            }
          >
            <PageHeaderNav aria-label="Project sections">
              <Tabs
                selectedKey={section}
                onSelectionChange={(key) => setSection(String(key))}
              >
                <TabsList className="h-9 p-1">
                  {sections.map((item) => (
                    <TabsTrigger key={item.id} id={item.id}>
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </PageHeaderNav>
          </OverflowItem>
          <OverflowSpacer />
          <OverflowItem
            id="view"
            priority={1}
            overflow={
              <DropdownMenuGroup
                selectionMode="single"
                selectedKeys={[view]}
                onSelectionChange={(keys) => {
                  const next = [...keys][0]
                  if (next) setView(String(next))
                }}
              >
                <DropdownMenuLabel>View</DropdownMenuLabel>
                <DropdownMenuItem id="list">
                  <ListIcon />
                  List
                </DropdownMenuItem>
                <DropdownMenuItem id="graph">
                  <WaypointsIcon />
                  Graph
                </DropdownMenuItem>
              </DropdownMenuGroup>
            }
          >
            <ToggleGroup
              aria-label="View"
              selectionMode="single"
              selectedKeys={[view]}
              onSelectionChange={(keys) => {
                const next = [...keys][0]
                if (next) setView(String(next))
              }}
              disallowEmptySelection
              variant="outline"
              size="sm"
              spacing={0}
            >
              <ToggleGroupItem id="list" aria-label="List view">
                <ListIcon /> List
              </ToggleGroupItem>
              <ToggleGroupItem id="graph" aria-label="Graph view">
                <WaypointsIcon /> Graph
              </ToggleGroupItem>
            </ToggleGroup>
          </OverflowItem>
        </PageHeaderActions>
      </PageHeader>
      <p className="mt-3 text-xs text-muted-foreground">
        Drag the corner to resize.
      </p>
    </div>
  )
}
```

## Eyebrow

Use `PageHeaderEyebrow` for a breadcrumb or category above the title.

**Example — `page-header-eyebrow`**

```tsx
import { Badge } from "@tecton/react/components/badge"
import { Link } from "@tecton/react/tecton/link"
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

export default function PageHeaderEyebrowExample() {
  return (
    <PageHeader className="w-full max-w-2xl">
      <PageHeaderContent>
        <PageHeaderEyebrow className="flex items-center gap-1.5">
          <Link href="#" variant="muted">
            Gullfaks
          </Link>
          <span>/</span>
          <Link href="#" variant="muted">
            Wells
          </Link>
        </PageHeaderEyebrow>
        <PageHeaderTitle className="flex items-center gap-3">
          34/10-A-12
          <Badge size="md" variant="success">
            Producing
          </Badge>
        </PageHeaderTitle>
        <PageHeaderDescription>
          Drilled 2019 · TD 3 250 m · 2 sidetracks
        </PageHeaderDescription>
      </PageHeaderContent>
    </PageHeader>
  )
}
```

## API Reference

### PageHeader, PageHeaderContent, PageHeaderEyebrow, PageHeaderTitle, PageHeaderDescription, PageHeaderNav

Plain styled elements; `PageHeaderTitle` is an `h1` and `PageHeaderNav` is a `nav` (give it an `aria-label`).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | - |  |

### PageHeaderActions

An [Overflow](/docs/tecton/overflow.md) row (a plain `div`, not a toolbar, so a tab list inside keeps its own arrow keys); accepts every `Overflow` prop.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `labels` | `"auto" \| "always" \| "never"` | "auto" | Whether labels drop to icons before items overflow. |
