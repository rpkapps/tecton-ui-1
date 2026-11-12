"use client"

import * as React from "react"

import { Field, FieldLabel } from "@tecton/react/field"
import { Switch } from "@tecton/react/switch"
import { ToggleGroup, ToggleGroupItem } from "@tecton/react/toggle-group"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableToolbar,
} from "@tecton/react/data-table"

type Reading = {
  id: string
  well: string
  time: Date
  quality: "good" | "suspect" | "estimated"
  oil: number
  water: number
}

// ---- The server ----------------------------------------------------------
// In an application this is an API that sends the meter readings 50 at a
// time, with the number there are.

const TOTAL = 500
const BATCH = 50
const WELLS = ["34/7-A-2", "34/7-A-5 H", "34/7-B-1", "34/7-C-3 AH", "34/10-D-4"]
const QUALITIES: Array<Reading["quality"]> = [
  "good",
  "good",
  "good",
  "suspect",
  "estimated",
]
const START = Date.UTC(2026, 10, 1)

/** The reading at `index`, from a seeded generator: the same on every load. */
function readingAt(index: number): Reading {
  const seed = (index * 2654435761) % 2 ** 32
  return {
    id: `r${index + 1}`,
    well: WELLS[index % WELLS.length],
    // Five wells read every hour.
    time: new Date(START + Math.floor(index / WELLS.length) * 3_600_000),
    quality: QUALITIES[(seed >>> 4) % QUALITIES.length],
    oil: 40 + (seed % 900) / 10,
    water: 5 + ((seed >>> 12) % 600) / 10,
  }
}

function fetchReadings(offset: number, fail: boolean) {
  return new Promise<{ rows: Array<Reading>; total: number }>(
    (resolve, reject) => {
      setTimeout(() => {
        if (fail) {
          reject(new Error("The next readings could not be loaded."))
          return
        }
        const count = Math.min(BATCH, TOTAL - offset)
        resolve({
          rows: Array.from({ length: count }, (_, i) => readingAt(offset + i)),
          total: TOTAL,
        })
      }, 600)
    }
  )
}

// ---- The table -----------------------------------------------------------

const volume = { maximumFractionDigits: 1, minimumFractionDigits: 1 }

const columns = createColumns<Reading>([
  { id: "well", header: "Well" },
  {
    id: "time",
    header: "Time",
    type: "date",
    format: {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    },
  },
  {
    id: "quality",
    header: "Quality",
    type: "options",
    options: [
      { value: "good", label: "Good", variant: "success" },
      { value: "suspect", label: "Suspect", variant: "warning" },
      { value: "estimated", label: "Estimated", variant: "info" },
    ],
  },
  { id: "oil", header: "Oil (Sm³)", type: "number", format: volume },
  { id: "water", header: "Water (Sm³)", type: "number", format: volume },
])

const MODES = ["scroll", "button"] as const

export default function DataTableLoadMore() {
  const [mode, setMode] = React.useState<(typeof MODES)[number]>("scroll")
  const [failNext, setFailNext] = React.useState(false)
  const [readings, setReadings] = React.useState<Array<Reading>>([])
  const [total, setTotal] = React.useState<number>()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>()

  // Read when a request goes out.
  const fail = React.useRef(failNext)
  fail.current = failNext

  // The readings after the `offset` first ones; the latest request wins.
  const request = React.useRef(0)
  const load = React.useCallback((offset: number) => {
    const id = ++request.current
    setLoading(true)
    setError(undefined)
    fetchReadings(offset, fail.current).then(
      (result) => {
        if (id !== request.current) return
        setReadings((loaded) => [...loaded.slice(0, offset), ...result.rows])
        setTotal(result.total)
        setLoading(false)
      },
      (reason: Error) => {
        if (id !== request.current) return
        setError(reason.message)
        setLoading(false)
        // One failure: Retry then loads.
        setFailNext(false)
      }
    )
  }, [])

  // The first batch.
  React.useEffect(() => load(0), [load])

  return (
    <DataTable
      items={readings}
      columns={columns}
      dataMode="server"
      rowCount={total}
      sortable={false}
      loading={loading}
      error={error}
      onRetry={() => load(readings.length)}
      hasMore={total === undefined || readings.length < total}
      loadMore={mode}
      onLoadMore={() => load(readings.length)}
      size="sm"
      // A bounded height: the rows scroll under the toolbar.
      className="h-96 w-full"
    >
      <DataTableToolbar className="gap-4">
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Load more"
          value={[mode]}
          onValueChange={(next) => {
            const picked = MODES.find((candidate) => candidate === next[0])
            if (picked) setMode(picked)
          }}
        >
          <ToggleGroupItem value="scroll">On scroll</ToggleGroupItem>
          <ToggleGroupItem value="button">With a button</ToggleGroupItem>
        </ToggleGroup>
        <Field orientation="horizontal" className="w-auto">
          <Switch
            id="data-table-fail-next"
            checked={failNext}
            onCheckedChange={setFailNext}
          />
          <FieldLabel htmlFor="data-table-fail-next">
            Fail the next batch
          </FieldLabel>
        </Field>
      </DataTableToolbar>
      <DataTableContent aria-label="Meter readings" virtualized totals />
    </DataTable>
  )
}
