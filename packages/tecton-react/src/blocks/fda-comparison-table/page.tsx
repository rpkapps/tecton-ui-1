"use client"

import * as React from "react"
import { cn } from "cn"
import { PlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DataTable,
  type RowSelectionState,
} from "@tecton/react/tecton/data-table"

import { createFdaColumns, MonoValue } from "./components/fda-columns"
import {
  alternatives as allAlternatives,
  type FieldDevelopmentAlternative,
} from "./data"

type FdaComparisonTableProps = Omit<
  React.ComponentProps<typeof DataTable<FieldDevelopmentAlternative>>,
  "columns" | "data"
> & {
  data?: FieldDevelopmentAlternative[]
  onOpen?: (fda: FieldDevelopmentAlternative) => void
  onAddComparison?: () => void
}

/**
 * FDA comparison table — ranked field development alternatives with mono
 * economics, an auto-coloured risk meter, status chips and a row menu.
 */
function FdaComparisonTable({
  className,
  data = allAlternatives,
  onOpen,
  onAddComparison,
  density = "sm",
  enableSelection = true,
  ...props
}: FdaComparisonTableProps) {
  const [rows, setRows] = React.useState(data)
  const [selection, setSelection] = React.useState<RowSelectionState>({})

  const columns = React.useMemo(
    () =>
      createFdaColumns({
        onOpen,
        onDuplicate: (fda) =>
          setRows((current) => [
            ...current,
            {
              ...fda,
              id: `${fda.id}-copy-${current.length}`,
              code: `${fda.code} (copy)`,
              status: "screening",
            },
          ]),
        onDelete: (fda) =>
          setRows((current) => current.filter((row) => row.id !== fda.id)),
      }),
    [onOpen]
  )

  const selectedCount = Object.values(selection).filter(Boolean).length

  return (
    <DataTable
      data-slot="fda-comparison-table"
      label="Field development alternatives"
      className={cn("bg-card", className)}
      columns={columns}
      data={rows}
      density={density}
      enableSelection={enableSelection}
      getRowId={(row) => row.id}
      onRowSelectionChange={setSelection}
      onRowAction={(_, row) => onOpen?.(row)}
      emptyMessage="No alternatives yet."
      footer={
        <Button variant="ghost" size="xs" onPress={onAddComparison}>
          <PlusIcon /> Add comparison
          {selectedCount > 1 && (
            <span className="text-muted-foreground">({selectedCount})</span>
          )}
        </Button>
      }
      {...props}
    />
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
export type { FieldDevelopmentAlternative, FdaStatus } from "./data"
