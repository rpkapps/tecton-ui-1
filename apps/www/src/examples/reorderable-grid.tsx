"use client"

import * as React from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Reorderable,
  ReorderableHandle,
  ReorderableItem,
} from "@tecton/react/tecton/reorderable"

const TILES = [
  { id: "oil", name: "Oil rate", value: "12,480", unit: "bbl/d" },
  { id: "gas", name: "Gas rate", value: "38.2", unit: "MMscf/d" },
  { id: "water", name: "Water cut", value: "21", unit: "%" },
  { id: "gor", name: "Gas–oil ratio", value: "3,060", unit: "scf/bbl" },
  { id: "whp", name: "Pressure", value: "186", unit: "bar at wellhead" },
  { id: "uptime", name: "Uptime", value: "97.4", unit: "%" },
]

export default function ReorderableGrid() {
  const [tiles, setTiles] = React.useState(TILES)

  return (
    <Reorderable
      orientation="grid"
      aria-label="Dashboard tiles"
      value={tiles.map((tile) => tile.id)}
      onValueChange={(order) =>
        setTiles((all) => order.map((id) => all.find((t) => t.id === id)!))
      }
      className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {tiles.map((tile) => (
        <ReorderableItem
          key={tile.id}
          value={tile.id}
          label={tile.name}
          render={<Card size="sm" />}
        >
          <CardHeader>
            <CardTitle>{tile.name}</CardTitle>
            <CardDescription>{tile.unit}</CardDescription>
            <CardAction>
              <ReorderableHandle />
            </CardAction>
          </CardHeader>
          <CardContent className="font-mono text-2xl tabular-nums">
            {tile.value}
          </CardContent>
        </ReorderableItem>
      ))}
    </Reorderable>
  )
}
