import { createDataTableColumns, DataTable } from "@tecton/react/tecton/data-table"

type Pick = { horizon: string; well: string; md: number }

const picks: Pick[] = [
  { horizon: "Top Balder", well: "34/10-A-12", md: 1840 },
  { horizon: "Top Sele", well: "34/10-A-12", md: 1905 },
  { horizon: "Base Cretaceous", well: "34/10-A-12", md: 2410 },
]

const helper = createDataTableColumns<Pick>()
const columns = helper.columns([
  helper.accessor("horizon", { header: "Horizon" }),
  helper.accessor("well", { header: "Well" }),
  helper.accessor("md", { header: "MD (m)" }),
])

export default function DataTableDensity() {
  return (
    <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
      <DataTable label="Picks (medium)" density="md" columns={columns} data={picks} />
      <DataTable label="Picks (small)" density="sm" columns={columns} data={picks} alternateRows={false} />
    </div>
  )
}
