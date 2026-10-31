"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

const readings = Array.from({ length: 5_000 }, (_, i) => ({
  depth: 1000 + i * 0.5,
  gamma: 40 + ((i * 37) % 90),
  resistivity: (2 + ((i * 13) % 180) / 10).toFixed(1),
}))

export default function TableVirtualized() {
  return (
    <div className="h-80 w-full max-w-md overflow-hidden rounded-md border">
      <Table aria-label="Log readings" virtualized>
        <TableHeader>
          <TableRow>
            <TableHead className="text-end">MD (m)</TableHead>
            <TableHead className="text-end">GR (API)</TableHead>
            <TableHead className="text-end">RT (Ωm)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {readings.map((reading) => (
            <TableRow key={reading.depth}>
              <TableCell className="text-end font-mono tabular-nums">
                {reading.depth.toFixed(1)}
              </TableCell>
              <TableCell className="text-end font-mono tabular-nums">
                {reading.gamma}
              </TableCell>
              <TableCell className="text-end font-mono tabular-nums">
                {reading.resistivity}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
