"use client"

import {
  createColumns,
  DataTable,
  DataTableActionBar,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

type Asset = {
  id: string
  name: string
  kind: string
  status?: "producing" | "shut-in" | "drilling"
  depth?: number
  children?: Array<Asset>
}

const assets: Array<Asset> = [
  {
    id: "gullfaks",
    name: "Gullfaks",
    kind: "Field",
    children: [
      {
        id: "gfa",
        name: "Gullfaks A",
        kind: "Platform",
        children: [
          {
            id: "a12",
            name: "34/10-A-12",
            kind: "Well",
            status: "producing",
            depth: 3250,
            children: [
              {
                id: "a12-t2",
                name: "34/10-A-12 T2",
                kind: "Sidetrack",
                status: "producing",
                depth: 3610,
              },
            ],
          },
          {
            id: "a7",
            name: "34/10-A-7",
            kind: "Well",
            status: "shut-in",
            depth: 2875,
          },
        ],
      },
      {
        id: "gfc",
        name: "Gullfaks C",
        kind: "Platform",
        children: [
          {
            id: "c4",
            name: "34/10-C-4",
            kind: "Well",
            status: "producing",
            depth: 3390,
          },
        ],
      },
    ],
  },
  {
    id: "snorre",
    name: "Snorre",
    kind: "Field",
    children: [
      {
        id: "sna",
        name: "Snorre A",
        kind: "Platform",
        children: [
          {
            id: "p7",
            name: "34/7-P-7",
            kind: "Well",
            status: "drilling",
            depth: 1420,
          },
          {
            id: "p9",
            name: "34/7-P-9",
            kind: "Well",
            status: "producing",
            depth: 4410,
          },
        ],
      },
    ],
  },
  {
    id: "valhall",
    name: "Valhall",
    kind: "Field",
    children: [
      {
        id: "g2",
        name: "2/8-G-2",
        kind: "Well",
        status: "producing",
        depth: 2730,
      },
    ],
  },
]

const columns = createColumns<Asset>([
  { id: "name", header: "Name" },
  { id: "kind", header: "Type" },
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

export default function DataTableTree() {
  return (
    <DataTable
      items={assets}
      columns={columns}
      itemToChildren={(asset) => asset.children}
      defaultExpanded={["gullfaks", "gfa"]}
      selectionMode="multiple"
      className="w-full"
    >
      <DataTableActionBar />
      <DataTableContent aria-label="Assets" />
    </DataTable>
  )
}
