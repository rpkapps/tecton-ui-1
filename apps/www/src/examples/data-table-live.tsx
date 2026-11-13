"use client"

import * as React from "react"
import { FilesIcon, LayersIcon, PauseIcon, PlayIcon } from "lucide-react"

import { Button } from "@tecton/react/button"
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@tecton/react/dropdown-menu"
import {
  OverflowItem,
  OverflowLabel,
  OverflowSpacer,
} from "@tecton/react/overflow"
import { Toggle } from "@tecton/react/toggle"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTablePagination,
  DataTableRowActions,
  DataTableToolbar,
  type DataTablePartialView,
} from "@tecton/react/data-table"

type Alarm = {
  id: string
  well: string
  tag: string
  pressure: number
  raised: Date
  severity: "high" | "medium" | "low"
}

// ---- The feed ------------------------------------------------------------
// In an application this is a subscription (a WebSocket, server-sent
// events) that pushes each alarm as it is raised.

const WELLS = [
  "34/7-A-2",
  "34/7-A-5 H",
  "34/7-B-1",
  "34/7-C-3 AH",
  "34/10-D-4",
  "34/10-E-1",
  "35/9-F-2",
  "35/9-G-6 T2",
]
const TAGS = ["PT-101", "PT-204", "TT-310", "FT-402", "LT-515"]
const SEVERITIES: Array<Alarm["severity"]> = ["high", "medium", "low"]
const START = Date.UTC(2026, 10, 12, 6)

/** A seeded generator: the same alarms on every visit. */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

function alarmAt(index: number, random: () => number): Alarm {
  return {
    id: `alarm-${index + 1}`,
    well: WELLS[Math.floor(random() * WELLS.length)],
    tag: TAGS[Math.floor(random() * TAGS.length)],
    // Sorted by pressure, each new alarm lands anywhere in the table.
    pressure: Math.round(80 + random() * 4200) / 10,
    raised: new Date(START + index * 47_000),
    severity: SEVERITIES[Math.floor(random() * SEVERITIES.length)],
  }
}

const FIRST = 40
/** No more alarms past this many: the example's feed stops. */
const MOST = 400

const columns = createColumns<Alarm>([
  { id: "well", header: "Well" },
  { id: "tag", header: "Tag" },
  { id: "pressure", header: "Pressure (bar)", type: "number" },
  {
    id: "severity",
    header: "Severity",
    type: "options",
    options: [
      { value: "high", label: "High", variant: "destructive" },
      { value: "medium", label: "Medium", variant: "warning" },
      { value: "low", label: "Low", variant: "secondary" },
    ],
  },
  {
    id: "raised",
    header: "Raised",
    type: "date",
    format: { timeStyle: "medium", timeZone: "UTC" },
  },
  {
    id: "actions",
    header: "Actions",
    sortable: false,
    align: "end",
    cell: () => (
      <DataTableRowActions>
        <DropdownMenuItem>Acknowledge</DropdownMenuItem>
        <DropdownMenuItem>Open trend</DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
])

const SORTING: DataTablePartialView["sorting"] = [
  { column: "pressure", direction: "descending" },
]

export default function DataTableLive() {
  const [random] = React.useState(() => seeded(20261113))
  const [alarms, setAlarms] = React.useState(() =>
    Array.from({ length: FIRST }, (_, i) => alarmAt(i, random))
  )
  // Paused until the reader starts it.
  const [running, setRunning] = React.useState(false)
  const full = alarms.length >= MOST
  // The cases to try: a page at a time, rows grouped by severity.
  const [paged, setPaged] = React.useState(false)
  const [view, setView] = React.useState<DataTablePartialView>({
    sorting: SORTING,
    columns: { pinned: { start: ["well"] } },
  })
  const grouped = (view.grouping ?? []).length > 0
  const setGrouped = (on: boolean) =>
    setView((current) => ({ ...current, grouping: on ? ["severity"] : [] }))

  // A new alarm every two seconds while the feed runs.
  React.useEffect(() => {
    if (!running || full) return
    const timer = setInterval(() => {
      setAlarms((current) => [...current, alarmAt(current.length, random)])
    }, 2000)
    return () => clearInterval(timer)
  }, [running, full, random])

  return (
    <DataTable
      items={alarms}
      columns={columns}
      highlightChanges
      selectionMode="multiple"
      striped
      size="sm"
      groupable
      view={view}
      onViewChange={setView}
      // Ten rows a page: new alarms land on other pages too.
      pagination={paged}
      defaultPageSize={10}
      // Without pages, a bounded height: the rows scroll, and the new ones
      // out of view are counted at its edges.
      className={paged ? "w-full" : "h-96 w-full"}
    >
      <DataTableToolbar aria-label="Alarm feed">
        <Button
          variant="outline"
          size="sm"
          disabled={full}
          onClick={() => setRunning((on) => !on)}
        >
          {running && !full ? (
            <PauseIcon data-icon="inline-start" aria-hidden />
          ) : (
            <PlayIcon data-icon="inline-start" aria-hidden />
          )}
          {running && !full
            ? "Pause feed"
            : alarms.length > FIRST
              ? "Resume feed"
              : "Start feed"}
        </Button>
        <OverflowItem
          value="pages"
          label="Pages"
          overflow={
            <DropdownMenuCheckboxItem
              checked={paged}
              onCheckedChange={setPaged}
            >
              <FilesIcon />
              Pages
            </DropdownMenuCheckboxItem>
          }
        >
          <Toggle
            variant="outline"
            size="sm"
            pressed={paged}
            onPressedChange={setPaged}
          >
            <FilesIcon data-icon="inline-start" aria-hidden />
            <OverflowLabel>Pages</OverflowLabel>
          </Toggle>
        </OverflowItem>
        <OverflowItem
          value="group"
          label="Group by severity"
          overflow={
            <DropdownMenuCheckboxItem
              checked={grouped}
              onCheckedChange={setGrouped}
            >
              <LayersIcon />
              Group by severity
            </DropdownMenuCheckboxItem>
          }
        >
          <Toggle
            variant="outline"
            size="sm"
            pressed={grouped}
            onPressedChange={setGrouped}
          >
            <LayersIcon data-icon="inline-start" aria-hidden />
            <OverflowLabel>Group by severity</OverflowLabel>
          </Toggle>
        </OverflowItem>
        <OverflowSpacer />
        <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
          {alarms.length} alarms
        </span>
      </DataTableToolbar>
      <DataTableContent aria-label="Pressure alarms" virtualized={!paged} />
      {paged && (
        <DataTableFooter>
          <DataTablePagination />
        </DataTableFooter>
      )}
    </DataTable>
  )
}
