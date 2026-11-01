"use client"

import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import { Meter } from "@tecton/react/tecton/meter"
import {
  Reorderable,
  ReorderableHandle,
  ReorderableItem,
} from "@tecton/react/tecton/reorderable"
import {
  Stat,
  StatDelta,
  StatHelp,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

const ALARMS = [
  { name: "High annulus pressure", time: "08:41", severity: "High" },
  { name: "ESP trip", time: "03:12", severity: "Medium" },
  { name: "Sand detector", time: "Yesterday", severity: "Low" },
] as const

const SEVERITY = {
  High: "destructive",
  Medium: "warning",
  Low: "info",
} as const

type Tile = {
  id: string
  name: string
  detail: string
  /** The tile's size in the grid: it keeps it wherever it moves. */
  span?: string
  content: React.ReactNode
}

const TILES: Array<Tile> = [
  {
    id: "production",
    name: "Production",
    detail: "Last 24 hours",
    span: "col-span-2 row-span-2",
    content: (
      <>
        <Stat size="lg" className="mb-auto">
          <StatLabel>Oil</StatLabel>
          <StatValue unit="bbl/d">12,480</StatValue>
          <StatDelta trend="up">+3.2% vs. last week</StatDelta>
        </Stat>
        <div className="grid grid-cols-2 gap-3 border-t pt-3">
          <Stat>
            <StatLabel>Gas</StatLabel>
            <StatValue unit="MMscf/d">38.2</StatValue>
            <StatDelta trend="up">+1.1%</StatDelta>
          </Stat>
          <Stat>
            <StatLabel>Water</StatLabel>
            <StatValue unit="bbl/d">3,310</StatValue>
            <StatDelta trend="up" tone="negative">
              +4.0%
            </StatDelta>
          </Stat>
        </div>
      </>
    ),
  },
  {
    id: "pressure",
    name: "Pressure",
    detail: "Wellhead",
    content: (
      <Stat size="md">
        <StatValue unit="bar">186</StatValue>
        <StatDelta trend="flat">Stable</StatDelta>
      </Stat>
    ),
  },
  {
    id: "alarms",
    name: "Alarms",
    detail: "3 open",
    span: "row-span-2",
    content: (
      <ul className="grid gap-3">
        {ALARMS.map((alarm) => (
          <li key={alarm.name} className="grid justify-items-start gap-1">
            <Badge variant={SEVERITY[alarm.severity]}>{alarm.severity}</Badge>
            <span>{alarm.name}</span>
            <span className="text-xs text-muted-foreground">{alarm.time}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "uptime",
    name: "Uptime",
    detail: "30 days",
    content: (
      <Meter
        aria-label="Uptime"
        value={97.4}
        segments={1}
        color="success"
        showValue
      />
    ),
  },
  {
    id: "job",
    name: "Next job",
    detail: "14 Nov, 06:00",
    span: "col-span-2",
    content: (
      <div className="grid gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-medium">Wireline logging</span>
          <Badge variant="info" appearance="outline">
            Scheduled
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Resistivity and density, 2,450 m to TD
        </p>
      </div>
    ),
  },
  {
    id: "water-cut",
    name: "Water cut",
    detail: "Last test",
    content: (
      <Stat size="md">
        <StatValue unit="%">21</StatValue>
        <StatDelta trend="up" tone="negative">
          +2 pts
        </StatDelta>
      </Stat>
    ),
  },
  {
    id: "crew",
    name: "On site",
    detail: "Rig crew",
    content: (
      <Stat size="md">
        <StatValue unit="people">14</StatValue>
        <StatHelp>3 contractors</StatHelp>
      </Stat>
    ),
  },
]

export default function ReorderableBento() {
  const [tiles, setTiles] = React.useState(TILES)

  return (
    <Reorderable
      orientation="grid"
      aria-label="Well dashboard"
      value={tiles.map((tile) => tile.id)}
      onValueChange={(order) =>
        setTiles((all) => order.map((id) => all.find((t) => t.id === id)!))
      }
      className="grid w-full max-w-3xl auto-rows-[minmax(8.5rem,auto)] grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {tiles.map((tile) => (
        <ReorderableItem
          key={tile.id}
          value={tile.id}
          label={tile.name}
          className={tile.span}
          render={<Card size="sm" />}
        >
          <CardHeader>
            <CardTitle>{tile.name}</CardTitle>
            <CardDescription>{tile.detail}</CardDescription>
            <CardAction>
              <ReorderableHandle />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-end gap-3">
            {tile.content}
          </CardContent>
        </ReorderableItem>
      ))}
    </Reorderable>
  )
}
