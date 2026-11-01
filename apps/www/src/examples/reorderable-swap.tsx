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
  Stat,
  StatDelta,
  StatHelp,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"
import {
  Reorderable,
  ReorderableHandle,
  ReorderableItem,
  ReorderableSlot,
} from "@tecton/react/tecton/reorderable"

/**
 * The layout: the slots and their sizes, in order. It never changes; the
 * tiles move between the slots. Each tile is a size container, so it shows
 * more in a bigger slot (`@min-[14rem]:` for a wide one, a min-height query
 * for a tall one), also while a drag shows it in another slot.
 */
const SLOTS = ["col-span-2 row-span-2", "", "row-span-2", "", "", "", "", ""]

/** Wide slots (two columns) show a tile's detail. */
const WIDE = "hidden @min-[14rem]:grid"
/** Tall slots (two rows) show a tile's list. */
const TALL = "hidden [@container(min-height:18rem)]:flex"
/** A value set larger where its slot is wide or tall. */
const BIG =
  "@min-[14rem]:[--stat-value:1.75rem] [@container(min-height:18rem)]:[--stat-value:1.75rem]"

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

const TILES: Record<
  string,
  {
    name: string
    detail: string
    content: React.ReactNode
    /** A list reads from the top; a figure sits at the bottom. */
    list?: boolean
  }
> = {
  production: {
    name: "Production",
    detail: "Last 24 hours",
    content: (
      <>
        <Stat className={`mb-auto ${BIG}`}>
          <StatLabel>Oil</StatLabel>
          <StatValue unit="bbl/d">12,480</StatValue>
          <StatDelta trend="up">
            +3.2%
            <span className="hidden @min-[14rem]:inline"> vs. last week</span>
          </StatDelta>
        </Stat>
        <div className={`${WIDE} grid-cols-2 gap-3 border-t pt-3`}>
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
  pressure: {
    name: "Pressure",
    detail: "Wellhead",
    content: (
      <Stat size="md" className={BIG}>
        <StatValue unit="bar">186</StatValue>
        <StatDelta trend="flat">Stable</StatDelta>
      </Stat>
    ),
  },
  alarms: {
    name: "Alarms",
    detail: "3 open",
    list: true,
    content: (
      <ul className="grid gap-2.5">
        {ALARMS.map((alarm, index) => (
          <li
            key={alarm.name}
            className={`min-w-0 flex-col items-start gap-1 @min-[14rem]:flex-row @min-[14rem]:items-center @min-[14rem]:gap-2 ${index ? TALL : "flex"}`}
          >
            <Badge variant={SEVERITY[alarm.severity]}>{alarm.severity}</Badge>
            <span className="max-w-full min-w-0 truncate @min-[14rem]:flex-1">
              {alarm.name}
            </span>
            <span className="hidden text-xs text-muted-foreground @min-[14rem]:inline">
              {alarm.time}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  uptime: {
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
  job: {
    name: "Next job",
    detail: "14 Nov, 06:00",
    content: (
      <div className="grid min-w-0 justify-items-start gap-1.5">
        <span className="max-w-full truncate font-medium">
          Wireline logging
        </span>
        <Badge variant="info" appearance="outline">
          Scheduled
        </Badge>
        <p className={`${WIDE} text-muted-foreground`}>
          Resistivity and density, 2,450 m to TD
        </p>
      </div>
    ),
  },
  "water-cut": {
    name: "Water cut",
    detail: "Last test",
    content: (
      <Stat size="md" className={BIG}>
        <StatValue unit="%">21</StatValue>
        <StatDelta trend="up" tone="negative">
          +2 pts
        </StatDelta>
      </Stat>
    ),
  },
  crew: {
    name: "On site",
    detail: "Rig crew",
    content: (
      <Stat size="md" className={BIG}>
        <StatValue unit="people">14</StatValue>
        <StatHelp>3 contractors</StatHelp>
      </Stat>
    ),
  },
}

export default function ReorderableSwap() {
  // The tile in each slot, in slot order; `null` leaves a slot empty.
  const [layout, setLayout] = React.useState<Array<string | null>>([
    "production",
    "pressure",
    "alarms",
    "uptime",
    "job",
    "water-cut",
    "crew",
    null,
  ])

  return (
    <Reorderable
      mode="swap"
      aria-label="Well dashboard"
      value={layout}
      onValueChange={setLayout}
      className="grid w-full max-w-3xl auto-rows-[10rem] grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {layout.map((id, index) => {
        const tile = id ? TILES[id] : null
        return (
          <ReorderableSlot key={index} className={SLOTS[index]}>
            {id && tile && (
              <ReorderableItem
                value={id}
                label={tile.name}
                render={<Card size="sm" />}
                className="[container-type:size]"
              >
                <CardHeader>
                  <CardTitle className="truncate">{tile.name}</CardTitle>
                  <CardDescription className="truncate">
                    {tile.detail}
                  </CardDescription>
                  <CardAction>
                    <ReorderableHandle />
                  </CardAction>
                </CardHeader>
                <CardContent
                  className={`flex min-h-0 flex-1 flex-col gap-3 overflow-hidden ${tile.list ? "justify-start" : "justify-end"}`}
                >
                  {tile.content}
                </CardContent>
              </ReorderableItem>
            )}
          </ReorderableSlot>
        )
      })}
    </Reorderable>
  )
}
