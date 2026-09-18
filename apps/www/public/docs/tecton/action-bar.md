# Action Bar

A transient bar for acting on a selection or on unsaved changes: a summary, then actions that collapse into a More menu as the bar narrows.

Source: /docs/tecton/action-bar.md

**Example — `action-bar-demo`**

```tsx
"use client"

import * as React from "react"
import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { RowSelectionState } from "@tanstack/react-table"
import {
  ArchiveIcon,
  DownloadIcon,
  TagIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import { Input } from "@tecton/react/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import {
  ActionBar,
  ActionBarActions,
  ActionBarSelection,
} from "@tecton/react/tecton/action-bar"
import {
  OverflowDivider,
  OverflowItem,
  OverflowLabel,
} from "@tecton/react/tecton/overflow"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
}

const wells: Well[] = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", status: "Producing" },
  { id: "b3", name: "34/10-B-3", field: "Gullfaks", status: "Shut in" },
  { id: "c7", name: "33/9-C-7", field: "Statfjord", status: "Drilling" },
  { id: "d2", name: "34/7-D-2", field: "Snorre", status: "Producing" },
  { id: "e9", name: "34/7-E-9", field: "Snorre", status: "Shut in" },
]

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({ rowSelectionFeature })
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: () => <Checkbox slot="selection" aria-label="Select all wells" />,
    cell: () => <Checkbox slot="selection" aria-label="Select well" />,
  }),
  columnHelper.accessor("name", { header: "Well" }),
  columnHelper.accessor("field", { header: "Field" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
])

export default function ActionBarDemo() {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({
    a12: true,
    c7: true,
  })
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  })
  const selected = table.getSelectedRowModel().rows.length
  const clear = () => table.resetRowSelection(true)

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      {/* The table toolbar; the action bar replaces it while rows are selected. */}
      <div className="grid min-h-11 items-center">
        {selected > 0 ? (
          <ActionBar
            placement="toolbar"
            aria-label="Selected wells"
            onDismiss={clear}
          >
            <ActionBarSelection
              count={selected}
              total={wells.length}
              onClear={clear}
            />
            <ActionBarActions aria-label="Selection actions">
              <OverflowItem
                id="assign"
                label="Assign"
                icon={<UserPlusIcon />}
                priority={2}
              >
                <Button variant="outline" size="sm">
                  <UserPlusIcon data-icon="inline-start" />
                  <OverflowLabel>Assign</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem
                id="tag"
                label="Add tag"
                icon={<TagIcon />}
                priority={1}
              >
                <Button variant="outline" size="sm">
                  <TagIcon data-icon="inline-start" />
                  <OverflowLabel>Add tag</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem id="export" label="Export" icon={<DownloadIcon />}>
                <Button variant="outline" size="sm">
                  <DownloadIcon data-icon="inline-start" />
                  <OverflowLabel>Export</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem id="archive" label="Archive" icon={<ArchiveIcon />}>
                <Button variant="outline" size="sm">
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
                <Button variant="destructive" size="sm">
                  <Trash2Icon data-icon="inline-start" />
                  Delete
                </Button>
              </OverflowItem>
            </ActionBarActions>
          </ActionBar>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              aria-label="Filter wells"
              placeholder="Filter wells"
              className="max-w-56"
            />
            <Button variant="outline" size="sm" className="ms-auto">
              New well
            </Button>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table
          aria-label="Wells"
          selectionMode="multiple"
          selectedKeys={table.getSelectedRowModel().rows.map((row) => row.id)}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              table.toggleAllRowsSelected(true)
            } else {
              table.setRowSelection(
                Object.fromEntries([...selection].map((key) => [key, true]))
              )
            }
          }}
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 1}
                className={header.column.id === "select" ? "w-10" : undefined}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => "No wells."}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

## Usage

```tsx
import {
  ActionBar,
  ActionBarSelection,
  ActionBarMessage,
  ActionBarActions,
} from "@tecton/react/tecton/action-bar"
import { OverflowItem, OverflowLabel } from "@tecton/react/tecton/overflow"
```

```tsx
<ActionBar isOpen={selected > 0} onDismiss={clear} aria-label="Selected wells">
  <ActionBarSelection count={selected} total={wells.length} onClear={clear} />
  <ActionBarActions aria-label="Selection actions">
    <OverflowItem id="tag" label="Add tag" icon={<TagIcon />} onAction={addTag}>
      <Button variant="outline" size="sm">
        <TagIcon data-icon="inline-start" />
        <OverflowLabel>Add tag</OverflowLabel>
      </Button>
    </OverflowItem>
    <Button size="sm" onPress={assign}>Assign</Button>
  </ActionBarActions>
</ActionBar>
```

The bar owns placement, the enter transition and Escape to dismiss (while focus is inside it). Everything in `ActionBarActions` is an [Overflow](/docs/tecton/overflow.md) toolbar: wrap the actions that may leave in `OverflowItem` and leave the primary action bare so it never does.

## Composition

```text
ActionBar
├── ActionBarSelection | ActionBarMessage
└── ActionBarActions (Toolbar)
    ├── OverflowItem …
    ├── OverflowDivider
    └── Button (fixed)
```

## Placement

`placement="toolbar"` fills the row a table toolbar normally occupies: render it in place of the search and filter controls while something is selected, as the first example does.

`placement="floating"` is a sticky card at the bottom of its scroll container. It stays inside the panel, not the viewport, so the bar keeps its width and its container queries.

**Example — `action-bar-floating`**

```tsx
"use client"

import * as React from "react"
import { ArchiveIcon, FolderInputIcon, TagIcon, Trash2Icon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  ActionBar,
  ActionBarActions,
  ActionBarSelection,
} from "@tecton/react/tecton/action-bar"
import {
  OverflowDivider,
  OverflowItem,
  OverflowLabel,
} from "@tecton/react/tecton/overflow"

const documents = Array.from({ length: 14 }, (_, index) => ({
  id: `doc-${index + 1}`,
  name: `Daily drilling report ${String(index + 1).padStart(2, "0")}.pdf`,
}))

export default function ActionBarFloating() {
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(["doc-2", "doc-5"])
  )
  const toggle = (id: string, isSelected: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (isSelected) next.add(id)
      else next.delete(id)
      return next
    })
  const clear = () => setSelected(new Set())

  return (
    // The bar is sticky inside the scroll container, so it stays within the panel.
    <div className="relative h-72 w-full max-w-xl overflow-y-auto rounded-md border">
      <ul className="divide-y">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex items-center gap-3 px-3 py-2 text-sm"
          >
            <Checkbox
              aria-label={`Select ${document.name}`}
              isSelected={selected.has(document.id)}
              onChange={(isSelected) => toggle(document.id, isSelected)}
            />
            {document.name}
          </li>
        ))}
      </ul>
      <ActionBar
        placement="floating"
        isOpen={selected.size > 0}
        onDismiss={clear}
        aria-label="Selected documents"
        className="mb-4"
      >
        <ActionBarSelection
          count={selected.size}
          label="documents"
          onClear={clear}
        />
        <ActionBarActions aria-label="Document actions">
          <OverflowItem
            id="move"
            label="Move to"
            icon={<FolderInputIcon />}
            priority={2}
          >
            <Button variant="outline" size="sm">
              <FolderInputIcon data-icon="inline-start" />
              <OverflowLabel>Move to</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            id="tag"
            label="Add tag"
            icon={<TagIcon />}
            priority={1}
          >
            <Button variant="outline" size="sm">
              <TagIcon data-icon="inline-start" />
              <OverflowLabel>Add tag</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="archive" label="Archive" icon={<ArchiveIcon />}>
            <Button variant="outline" size="sm">
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
            <Button variant="destructive" size="sm">
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </OverflowItem>
        </ActionBarActions>
      </ActionBar>
    </div>
  )
}
```

## Unsaved changes

The same bar with a message instead of a selection.

**Example — `action-bar-message`**

```tsx
"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  ActionBar,
  ActionBarActions,
  ActionBarMessage,
} from "@tecton/react/tecton/action-bar"
import { OverflowItem } from "@tecton/react/tecton/overflow"

const saved = { name: "34/10-A-12", operator: "Equinor" }

export default function ActionBarMessageExample() {
  const [draft, setDraft] = React.useState(saved)
  const dirty = draft.name !== saved.name || draft.operator !== saved.operator
  const discard = () => setDraft(saved)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="action-bar-message-name">Well</FieldLabel>
        <Input
          id="action-bar-message-name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="action-bar-message-operator">Operator</FieldLabel>
        <Input
          id="action-bar-message-operator"
          value={draft.operator}
          onChange={(event) =>
            setDraft({ ...draft, operator: event.target.value })
          }
        />
      </Field>
      <ActionBar
        placement="toolbar"
        isOpen={dirty}
        onDismiss={discard}
        aria-label="Unsaved changes"
      >
        <ActionBarMessage>You have unsaved changes</ActionBarMessage>
        <ActionBarActions aria-label="Save or discard">
          <OverflowItem
            id="discard"
            label="Discard"
            onAction={discard}
            labelBehavior="keep"
          >
            <Button variant="ghost" size="sm">
              Discard
            </Button>
          </OverflowItem>
          {/* Unwrapped: the primary action is fixed. */}
          <Button size="sm" onPress={discard}>
            Save
          </Button>
        </ActionBarActions>
      </ActionBar>
    </div>
  )
}
```

## Collapse order

The actions overflow by the [Overflow](/docs/tecton/overflow.md) rules first, then the summary compacts with container queries on the bar:

| Width | Selection summary |
| --- | --- |
| Wide | 12 of 340 selected · Clear |
| Below `lg` (32rem) | 12 selected · Clear |
| Below `sm` (24rem) | count badge and an X |

A visually hidden `aria-live` region always announces the full text.

## API Reference

### ActionBar

A `div` with `role="region"`; give it an `aria-label`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `placement` | `"toolbar" \| "floating"` | "toolbar" | Row fill, or sticky card at the bottom of the scroll container. |
| `isOpen` | `boolean` | true | Render the bar. |
| `onDismiss` | `() => void` | - | Called on Escape while focus is inside the bar and no overlay is open. |

### ActionBarSelection

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | - | Selected items. |
| `total` | `number` | - | Total items; adds "of N". |
| `label` | `string` | - | Noun after the count, e.g. "wells". |
| `onClear` | `() => void` | - | Renders the Clear control. |
| `clearLabel` | `string` | "Clear selection" | Accessible name of the compact Clear button. |

### ActionBarMessage

A `p` for a text summary.

### ActionBarActions

An [Overflow](/docs/tecton/overflow.md) `Toolbar` with `aria-label` defaulting to "Actions". Accepts every `Toolbar` prop.
