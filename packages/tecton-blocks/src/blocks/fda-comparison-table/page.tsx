"use client"

import * as React from "react"
import { cn } from "cn"
import { PlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DataTable,
  DataTableActionBar,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

import { createFdaColumns, MonoValue } from "./components/fda-columns"
import type { RankedAlternative } from "./components/fda-columns"
import { alternatives as allAlternatives } from "./data"
import type { FieldDevelopmentAlternative } from "./data"

type FdaComparisonTableProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue"
> & {
  data?: FieldDevelopmentAlternative[]
  onOpen?: (fda: FieldDevelopmentAlternative) => void
  /** Called with the selected alternatives, from the selection's action bar. */
  onAddComparison?: (fdas: FieldDevelopmentAlternative[]) => void
}

/** The alternative as the list keeps it, without its rank. */
function unranked({ rank: _rank, ...fda }: RankedAlternative) {
  return fda
}

/**
 * FDA comparison table — ranked field development alternatives with mono
 * economics, an auto-coloured risk meter, status badges and a row menu, on
 * a compact, striped `DataTable`: a header sorts its column, a row's
 * checkbox selects it, and Enter, a double click or a click while nothing
 * is selected opens it; the row's actions menu opens it too. While rows
 * are selected, an action bar adds them to a comparison.
 */
function FdaComparisonTable({
  className,
  data = allAlternatives,
  onOpen,
  onAddComparison,
  ...props
}: FdaComparisonTableProps) {
  const [rows, setRows] = React.useState(data)
  const [selected, setSelected] = React.useState<ReadonlyArray<string>>([])
  // Copies are numbered by a counter that only grows, so an id is never
  // reused after a row is deleted (the row count would repeat).
  const copies = React.useRef(0)

  // The rank is the alternative's place in the list, whatever the sort.
  const ranked = React.useMemo(
    () => rows.map((fda, index) => ({ ...fda, rank: index + 1 })),
    [rows]
  )

  const columns = React.useMemo(
    () =>
      createFdaColumns({
        onOpen: onOpen && ((fda) => onOpen(unranked(fda))),
        onDuplicate: (fda) => {
          copies.current += 1
          const id = `${fda.id}-copy-${copies.current}`
          setRows((current) => [
            ...current,
            {
              ...unranked(fda),
              id,
              code: `${fda.code} (copy)`,
              status: "screening",
            },
          ])
        },
        onDelete: (fda) =>
          setRows((current) => current.filter((row) => row.id !== fda.id)),
      }),
    [onOpen]
  )

  return (
    <DataTable
      items={ranked}
      columns={columns}
      selectionMode="multiple"
      value={selected}
      onValueChange={setSelected}
      size="sm"
      striped
      {...(onOpen === undefined
        ? {}
        : {
            onActivate: (_: string, fda: RankedAlternative) =>
              onOpen(unranked(fda)),
          })}
      className={cn("w-full", className)}
      {...props}
    >
      <DataTableActionBar aria-label="Selected alternatives">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onAddComparison?.(rows.filter((row) => selected.includes(row.id)))
          }
        >
          <PlusIcon data-icon="inline-start" /> Add comparison
        </Button>
      </DataTableActionBar>
      <DataTableContent
        aria-label="Field development alternatives"
        empty="No alternatives yet."
      />
    </DataTable>
  )
}

/** Route-ready page: the table with a small summary header. */
export default function FdaComparisonTablePage() {
  return (
    <div
      data-slot="fda-comparison-table-page"
      className="flex min-h-svh w-full flex-col gap-4 bg-background px-4 py-8 text-foreground md:px-8"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-medium">Field development alternatives</h1>
        <p className="text-sm text-muted-foreground">
          Ranked by NPV. Select two or more rows to compare cost, schedule and
          risk side by side.
        </p>
      </header>
      <FdaComparisonTable />
    </div>
  )
}

export { FdaComparisonTable, createFdaColumns, MonoValue }
export { alternatives, statusMeta, riskLabel, formatFirstOil } from "./data"
export type { FdaComparisonTableProps }
export type { RankedAlternative } from "./components/fda-columns"
export type { FieldDevelopmentAlternative, FdaStatus } from "./data"
