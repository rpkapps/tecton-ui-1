"use client"

import * as React from "react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "shut-in" | "drilling"
  depth: number
}

const wells: Array<Well> = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    status: "producing",
    depth: 3250,
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    status: "shut-in",
    depth: 2980,
  },
  {
    id: "p7",
    name: "34/7-P-7",
    field: "Snorre",
    status: "drilling",
    depth: 1420,
  },
  {
    id: "g2",
    name: "2/8-G-2",
    field: "Valhall",
    status: "producing",
    depth: 2730,
  },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
      { value: "drilling", label: "Drilling", variant: "info" },
    ],
  },
  { id: "depth", header: "TD (m)", type: "number" },
])

const STATES = {
  rows: "Rows",
  empty: "Empty",
  noResults: "No results",
  error: "Error",
  loading: "Loading",
  refreshing: "Refreshing",
} as const

type State = keyof typeof STATES

function isState(value: unknown): value is State {
  return typeof value === "string" && Object.hasOwn(STATES, value)
}

export default function DataTableStates() {
  const [state, setState] = React.useState<State>("error")
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  const retry = () => {
    setState("loading")
    timer.current = setTimeout(() => setState("rows"), 1200)
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <ToggleGroup
        variant="outline"
        size="sm"
        aria-label="State"
        className="flex-wrap"
        value={[state]}
        onValueChange={(value) => {
          if (isState(value[0])) setState(value[0])
        }}
      >
        {Object.entries(STATES).map(([value, label]) => (
          <ToggleGroupItem key={value} value={value}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DataTable
        // "No results" is a table whose search matches nothing; Clear
        // filters clears it, and the rows come back.
        key={state === "noResults" ? "no-results" : "table"}
        items={state === "empty" || state === "loading" ? [] : wells}
        columns={columns}
        loading={state === "loading" || state === "refreshing"}
        error={
          state === "error"
            ? "The well register did not answer. Check the connection and try again."
            : undefined
        }
        onRetry={retry}
        filterable
        defaultView={{ search: state === "noResults" ? "Johan Castberg" : "" }}
        onViewChange={(view) => {
          if (view.search === "") setState("rows")
        }}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    </div>
  )
}
