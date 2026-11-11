"use client"

import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

const wells = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    status: "Producing",
    depth: 3250,
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    status: "Shut in",
    depth: 2980,
  },
  {
    id: "c7",
    name: "33/9-C-7",
    field: "Statfjord",
    status: "Drilling",
    depth: 1420,
  },
  {
    id: "d2",
    name: "34/7-D-2",
    field: "Snorre",
    status: "Producing",
    depth: 2735,
  },
  {
    id: "e5",
    name: "30/9-E-5",
    field: "Oseberg",
    status: "Producing",
    depth: 3105,
  },
] as const

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

export default function TableSize() {
  const [size, setSize] = React.useState<"default" | "sm">("default")
  const [striped, setStriped] = React.useState(true)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Size"
          value={[size]}
          onValueChange={(value) => {
            if (value[0] === "default" || value[0] === "sm") setSize(value[0])
          }}
        >
          <ToggleGroupItem value="default">Default</ToggleGroupItem>
          <ToggleGroupItem value="sm">Small</ToggleGroupItem>
        </ToggleGroup>
        <Field orientation="horizontal" className="w-auto">
          <Switch
            id="table-striped"
            checked={striped}
            onCheckedChange={setStriped}
          />
          <FieldLabel htmlFor="table-striped">Striped</FieldLabel>
        </Field>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table aria-label="Wells" size={size} striped={striped}>
          <TableHeader>
            <TableRow>
              <TableHead>Well</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">TD (m)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wells.map((well) => (
              <TableRow key={well.id}>
                <TableCell>{well.name}</TableCell>
                <TableCell>{well.field}</TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant[well.status]}
                    appearance="outline"
                  >
                    {well.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-end font-mono tabular-nums">
                  {well.depth.toLocaleString("en-US")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
