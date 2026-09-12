import { Chip } from "@tecton/react/tecton/chip"
import { createDataTableColumns, DataTable } from "@tecton/react/tecton/data-table"

type Well = { name: string; field: string; status: "Producing" | "Shut in" | "Drilling"; td: number }

const wells: Well[] = [
  { name: "34/10-A-12", field: "Gullfaks", status: "Producing", td: 3250 },
  { name: "34/10-B-3", field: "Gullfaks", status: "Shut in", td: 2980 },
  { name: "33/9-C-7", field: "Statfjord", status: "Drilling", td: 1420 },
  { name: "33/9-D-1", field: "Statfjord", status: "Producing", td: 3610 },
]

const helper = createDataTableColumns<Well>()
const columns = helper.columns([
  helper.accessor("name", { header: "Well" }),
  helper.accessor("field", { header: "Field" }),
  helper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <Chip size="xs" color={info.getValue() === "Producing" ? "success" : "default"}>
        {info.getValue()}
      </Chip>
    ),
  }),
  helper.accessor("td", { header: "TD (m)", cell: (info) => info.getValue().toLocaleString() }),
])

export default function DataTableDemo() {
  return <DataTable className="max-w-2xl" label="Wells" columns={columns} data={wells} />
}
