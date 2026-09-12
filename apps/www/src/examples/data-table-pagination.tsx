import { createDataTableColumns, DataTable } from "@tecton/react/tecton/data-table"

type Well = { name: string; field: string; td: number }

const fields = ["Gullfaks", "Statfjord", "Snorre", "Visund"]
const wells: Well[] = Array.from({ length: 23 }, (_, i) => ({
  name: `34/10-${String.fromCharCode(65 + (i % 6))}-${i + 1}`,
  field: fields[i % fields.length],
  td: 1800 + ((i * 137) % 2200),
}))

const helper = createDataTableColumns<Well>()
const columns = helper.columns([
  helper.accessor("name", { header: "Well" }),
  helper.accessor("field", { header: "Field" }),
  helper.accessor("td", { header: "TD (m)", cell: (info) => info.getValue().toLocaleString() }),
])

export default function DataTablePagination() {
  return (
    <DataTable
      className="max-w-2xl"
      label="Wells"
      columns={columns}
      data={wells}
      pageSize={5}
      pageSizeOptions={[5, 10, 25]}
      footer={<span>{wells.length} wells</span>}
    />
  )
}
