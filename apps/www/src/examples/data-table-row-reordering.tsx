"use client"

import * as React from "react"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/data-table"

type Job = {
  id: string
  well: string
  job: string
  rig: string
  days: number
}

const JOBS: Array<Job> = [
  {
    id: "j1",
    well: "34/10-A-12",
    job: "Plug and abandon",
    rig: "Deepsea Atlantic",
    days: 21,
  },
  {
    id: "j2",
    well: "34/7-D-2",
    job: "Sidetrack",
    rig: "Transocean Spitsbergen",
    days: 34,
  },
  {
    id: "j3",
    well: "2/8-C-3",
    job: "Scale squeeze",
    rig: "Island Wellserver",
    days: 4,
  },
  {
    id: "j4",
    well: "34/10-B-3",
    job: "Gas lift valve change",
    rig: "Island Wellserver",
    days: 6,
  },
  {
    id: "j5",
    well: "6507/11-E-4",
    job: "Perforation",
    rig: "Deepsea Atlantic",
    days: 9,
  },
]

const columns = createColumns<Job>([
  { id: "well", header: "Well" },
  { id: "job", header: "Job" },
  { id: "rig", header: "Rig", hideBelow: "md" },
  { id: "days", header: "Days", type: "number" },
])

export default function DataTableRowReordering() {
  const [jobs, setJobs] = React.useState(JOBS)
  return (
    <DataTable
      items={jobs}
      columns={columns}
      reorderableRows
      onRowOrderChange={(ids) =>
        setJobs((current) =>
          ids.flatMap((id) => current.find((job) => job.id === id) ?? [])
        )
      }
      className="w-full"
    >
      <DataTableContent aria-label="Well intervention queue" />
    </DataTable>
  )
}
