"use client"

import * as React from "react"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableActionBar,
  DataTableFooter,
  DataTablePagination,
  type DataTableAllMatching,
  type DataTableSort,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "shut-in" | "drilling"
  depth: number
}

// ---- The server ----------------------------------------------------------
// In an application this is an API: it sorts, pages and counts the rows.

const FIELDS = ["Gullfaks", "Statfjord", "Snorre", "Oseberg", "Troll"]
const STATUSES: Array<Well["status"]> = ["producing", "shut-in", "drilling"]

const REGISTER: Array<Well> = Array.from({ length: 1240 }, (_, i) => {
  const seed = (i * 2654435761) % 2 ** 32
  return {
    id: `w${i + 1}`,
    name: `${30 + (i % 7)}/${1 + (i % 12)}-${String.fromCharCode(65 + (i % 26))}-${i + 1}`,
    field: FIELDS[seed % FIELDS.length],
    status: STATUSES[(seed >>> 3) % STATUSES.length],
    depth: 1200 + (seed % 3800),
  }
})

type Query = {
  sorting: ReadonlyArray<DataTableSort>
  page: number
  pageSize: number
}

function fetchWells(query: Query, signal: AbortSignal) {
  return new Promise<{ rows: Array<Well>; total: number }>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        const rows = [...REGISTER].sort((a, b) => {
          for (const { column, direction } of query.sorting) {
            const x = a[column as keyof Well]
            const y = b[column as keyof Well]
            const order =
              typeof x === "number" && typeof y === "number"
                ? x - y
                : String(x).localeCompare(String(y), "en", { numeric: true })
            if (order !== 0) return direction === "ascending" ? order : -order
          }
          return 0
        })
        const start = (query.page - 1) * query.pageSize
        resolve({
          rows: rows.slice(start, start + query.pageSize),
          total: rows.length,
        })
      }, 600)
      signal.addEventListener("abort", () => {
        clearTimeout(timer)
        reject(signal.reason)
      })
    }
  )
}

// ---- The table -----------------------------------------------------------

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

const PAGE_SIZE = 8

function describe(
  value: ReadonlyArray<string>,
  allMatching: DataTableAllMatching | null
) {
  if (allMatching)
    return allMatching.except.length > 0
      ? `every matching well except ${allMatching.except.join(", ")}`
      : "every matching well"
  return value.length > 0 ? value.join(", ") : "none"
}

export default function DataTableServer() {
  const [sorting, setSorting] = React.useState<ReadonlyArray<DataTableSort>>([])
  const [page, setPage] = React.useState(1)
  const [result, setResult] = React.useState<{
    rows: Array<Well>
    total: number
  }>()
  const [loading, setLoading] = React.useState(true)
  const [selection, setSelection] = React.useState("none")

  React.useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchWells({ sorting, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((next) => {
        setResult(next)
        setLoading(false)
      })
      .catch(() => {
        // Aborted: a newer request replaced this one.
      })
    return () => controller.abort()
  }, [sorting, page])

  const query = [
    ...sorting.map(
      (sort) =>
        `sort=${sort.column}:${sort.direction === "ascending" ? "asc" : "desc"}`
    ),
    `page=${page}`,
    `size=${PAGE_SIZE}`,
  ].join("&")

  return (
    <div className="flex w-full flex-col gap-3">
      <DataTable
        items={result?.rows ?? []}
        columns={columns}
        dataMode="server"
        rowCount={result?.total}
        loading={loading}
        onViewChange={(view) => setSorting(view.sorting)}
        pagination
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        selectionMode="multiple"
        onValueChange={(value, { allMatching }) =>
          setSelection(describe(value, allMatching))
        }
      >
        <DataTableActionBar />
        <DataTableContent aria-label="Well register" />
        <DataTableFooter>
          <DataTablePagination pageSizes={[]} />
        </DataTableFooter>
      </DataTable>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Request</dt>
        <dd className="font-mono break-all">GET /wells?{query}</dd>
        <dt className="text-muted-foreground">Selected</dt>
        <dd className="break-all">{selection}</dd>
      </dl>
    </div>
  )
}
