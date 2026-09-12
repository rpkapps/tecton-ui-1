import { createDataTableColumns, DataTable } from "@tecton/react/tecton/data-table"

type Well = { name: string; field: string; status: string; td: number }

const wells: Well[] = [
  { name: "34/10-A-12", field: "Gullfaks", status: "Producing", td: 3250 },
  { name: "34/10-B-3", field: "Gullfaks", status: "Shut in", td: 2980 },
  { name: "33/9-C-7", field: "Statfjord", status: "Drilling", td: 1420 },
]

const helper = createDataTableColumns<Well>()
const columns = helper.columns([
  helper.accessor("name", { header: "Well" }),
  helper.accessor("field", { header: "Field" }),
  helper.accessor("status", { header: "Status" }),
  helper.accessor("td", { header: "TD (m)" }),
])

export default function DataTableSmallScreen() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <DataTable label="Wells" columns={columns} data={wells} smallScreen density="sm" />
      <p className="text-xs text-muted-foreground">
        Resize the viewport below <code>md</code> to see cells stack with their column labels.
      </p>
    </div>
  )
}
