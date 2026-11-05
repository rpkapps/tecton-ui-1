"use client"

import * as React from "react"
import {
  ActivityIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BellIcon,
  CalendarClockIcon,
  CheckIcon,
  CylinderIcon,
  DropletsIcon,
  EllipsisIcon,
  FlameIcon,
  FlameKindlingIcon,
  GaugeIcon,
  Grid3x3Icon,
  LayoutGridIcon,
  PencilIcon,
  RotateCcwIcon,
  WavesIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@tecton/react/components/field"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import { Slider } from "@tecton/react/components/slider"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import { Meter } from "@tecton/react/tecton/meter"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"
import {
  Stat,
  StatDelta,
  StatGroup,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"
import {
  WidgetGrid,
  WidgetGridContent,
  WidgetGridHandle,
  WidgetGridItem,
  WidgetGridRemove,
  WidgetGridResizeHandle,
  WidgetGridSource,
  useWidgetGridItem,
  type WidgetGridLayoutItem,
} from "@tecton/react/tecton/widget-grid"

// --- Live data -------------------------------------------------------------
// The readings live outside React, and each widget subscribes to its own:
// a new reading re-renders that widget's body and nothing else — not the
// dashboard, not the grid, not the other widgets.

type Reading = { value: number; delta: number }

const SIGNALS = {
  oil: { start: 12480, step: 40, min: 11800, max: 13200 },
  gas: { start: 38.2, step: 0.2, min: 36, max: 41 },
  water: { start: 3310, step: 25, min: 3000, max: 3700 },
  pressure: { start: 186, step: 1.2, min: 172, max: 205 },
  uptime: { start: 97.4, step: 0.05, min: 96, max: 99.5 },
  flaring: { start: 410, step: 6, min: 340, max: 480 },
  oilTank: { start: 72, step: 0.6, min: 20, max: 96 },
  waterTank: { start: 88, step: 0.5, min: 40, max: 98 },
  chemicals: { start: 14, step: 0.3, min: 5, max: 40 },
  "A-12": { start: 18, step: 0.4, min: 8, max: 45 },
  "B-3": { start: 31, step: 0.4, min: 8, max: 45 },
  "C-7": { start: 24, step: 0.4, min: 8, max: 45 },
  "D-1": { start: 42, step: 0.4, min: 8, max: 60 },
} as const

type Signal = keyof typeof SIGNALS

const feed = (() => {
  const readings = new Map<Signal, Reading>(
    Object.entries(SIGNALS).map(([key, { start }]) => [
      key as Signal,
      { value: start, delta: 0 },
    ])
  )
  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setInterval> | undefined
  const tick = () => {
    for (const [key, { step, min, max }] of Object.entries(SIGNALS)) {
      const now = readings.get(key as Signal)!
      const value = Math.min(
        max,
        Math.max(min, now.value + (Math.random() - 0.5) * 2 * step)
      )
      readings.set(key as Signal, { value, delta: value - now.value })
    }
    for (const listener of listeners) listener()
  }
  return {
    read: (key: Signal) => readings.get(key)!,
    subscribe(listener: () => void) {
      listeners.add(listener)
      timer ??= setInterval(tick, 1000)
      return () => {
        listeners.delete(listener)
        if (!listeners.size) {
          clearInterval(timer)
          timer = undefined
        }
      }
    },
  }
})()

/** One signal's latest reading; re-renders only when that reading changes. */
function useReading(key: Signal) {
  return React.useSyncExternalStore(
    feed.subscribe,
    () => feed.read(key),
    () => feed.read(key)
  )
}

const format = (value: number, digits = 0) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

function Trend({ reading, digits = 0 }: { reading: Reading; digits?: number }) {
  const trend =
    Math.abs(reading.delta) < 1e-9 ? "flat" : reading.delta > 0 ? "up" : "down"
  return (
    <StatDelta trend={trend}>
      {reading.delta >= 0 ? "+" : "−"}
      {format(Math.abs(reading.delta), digits)}
    </StatDelta>
  )
}

// --- The widgets ------------------------------------------------------------
// Each body is memoized: moving, resizing or adding a widget never
// re-renders the body of another.

const Production = React.memo(function Production() {
  const oil = useReading("oil")
  const gas = useReading("gas")
  const water = useReading("water")
  return (
    <StatGroup className="grid-cols-1 @min-[19rem]:grid-cols-3">
      <Stat>
        <StatLabel>Oil</StatLabel>
        <StatValue unit="bbl/d">{format(oil.value)}</StatValue>
        <Trend reading={oil} />
      </Stat>
      <Stat className="hidden @min-[19rem]:grid">
        <StatLabel>Gas</StatLabel>
        <StatValue unit="MMscf/d">{format(gas.value, 1)}</StatValue>
        <Trend reading={gas} digits={1} />
      </Stat>
      <Stat className="hidden @min-[19rem]:grid">
        <StatLabel>Water</StatLabel>
        <StatValue unit="bbl/d">{format(water.value)}</StatValue>
        <Trend reading={water} />
      </Stat>
    </StatGroup>
  )
})

function LiveStat({
  signal,
  unit,
  digits = 0,
}: {
  signal: Signal
  unit: string
  digits?: number
}) {
  const reading = useReading(signal)
  return (
    <Stat>
      <StatValue unit={unit}>{format(reading.value, digits)}</StatValue>
      <Trend reading={reading} digits={digits} />
    </Stat>
  )
}

const OilRate = React.memo(function OilRate() {
  return <LiveStat signal="oil" unit="bbl/d" />
})
const GasRate = React.memo(function GasRate() {
  return <LiveStat signal="gas" unit="MMscf/d" digits={1} />
})
const Flaring = React.memo(function Flaring() {
  return <LiveStat signal="flaring" unit="Mscf" />
})

const Pressure = React.memo(function Pressure() {
  const reading = useReading("pressure")
  return (
    <div className="grid gap-3">
      <Stat>
        <StatValue unit="bar">{format(reading.value, 1)}</StatValue>
        <Trend reading={reading} digits={1} />
      </Stat>
      <Meter
        aria-label="Pressure against the 210 bar limit"
        label="Limit 210 bar"
        value={reading.value}
        max={210}
        color={reading.value > 198 ? "warning" : "info"}
      />
    </div>
  )
})

const Uptime = React.memo(function Uptime() {
  const reading = useReading("uptime")
  return (
    <Meter
      aria-label="Uptime"
      value={reading.value}
      segments={1}
      color="success"
      showValue
    />
  )
})

function Level({
  signal,
  label,
  warn,
}: {
  signal: Signal
  label: string
  warn: number
}) {
  const reading = useReading(signal)
  return (
    <Meter
      aria-label={label}
      label={label}
      value={reading.value}
      color={reading.value > warn ? "warning" : "default"}
      showValue
    />
  )
}

const Tanks = React.memo(function Tanks() {
  return (
    <div className="grid gap-2">
      <Level signal="oilTank" label="Oil" warn={90} />
      <Level signal="waterTank" label="Water" warn={90} />
      <Level signal="chemicals" label="Chemicals" warn={101} />
    </div>
  )
})

const WaterCut = React.memo(function WaterCut() {
  return (
    <div className="grid gap-2.5">
      {(["A-12", "B-3", "C-7", "D-1"] as const).map((well) => (
        <Level key={well} signal={well} label={well} warn={40} />
      ))}
    </div>
  )
})

const ALARMS = [
  {
    name: "High annulus pressure",
    well: "B-3",
    time: "08:41",
    severity: "High",
  },
  { name: "ESP trip", well: "D-1", time: "03:12", severity: "Medium" },
  { name: "Sand detector", well: "A-12", time: "Yesterday", severity: "Low" },
  {
    name: "Chemical tank low",
    well: "Pad 2",
    time: "Yesterday",
    severity: "Low",
  },
] as const

const SEVERITY = {
  High: "destructive",
  Medium: "warning",
  Low: "info",
} as const

const Alarms = React.memo(function Alarms() {
  return (
    <ul className="grid gap-2">
      {ALARMS.map((alarm) => (
        <li key={alarm.name} className="flex min-w-0 items-center gap-2">
          <Badge variant={SEVERITY[alarm.severity]}>{alarm.severity}</Badge>
          <span className="min-w-0 flex-1 truncate">{alarm.name}</span>
          <span className="hidden text-xs text-muted-foreground @min-[18rem]:inline">
            {alarm.well} · {alarm.time}
          </span>
        </li>
      ))}
    </ul>
  )
})

const NextJob = React.memo(function NextJob() {
  return (
    <div className="grid min-w-0 gap-1">
      <span className="truncate font-medium">Wireline logging</span>
      <span className="text-xs text-muted-foreground">14 Nov, 06:00 · C-7</span>
    </div>
  )
})

type Size = { w: number; h: number }

type Widget = {
  name: string
  description: string
  icon: React.ComponentType
  body: React.ComponentType
  /** The size a new one gets, its smallest size, and its size presets (12 columns). */
  size: Size
  min: Size
  presets: Record<"Small" | "Medium" | "Large", Size>
  /** A list reads from the top; a figure sits at the bottom. */
  list?: boolean
}

const KPI = {
  size: { w: 4, h: 2 },
  min: { w: 3, h: 2 },
  presets: {
    Small: { w: 4, h: 2 },
    Medium: { w: 6, h: 2 },
    Large: { w: 6, h: 3 },
  },
}

const WIDGETS: Record<string, Widget> = {
  production: {
    name: "Production",
    description: "Field total",
    icon: DropletsIcon,
    body: Production,
    size: { w: 8, h: 3 },
    min: { w: 4, h: 3 },
    presets: {
      Small: { w: 4, h: 3 },
      Medium: { w: 8, h: 3 },
      Large: { w: 12, h: 3 },
    },
  },
  oil: {
    name: "Oil rate",
    description: "Field total",
    icon: DropletsIcon,
    body: OilRate,
    ...KPI,
  },
  gas: {
    name: "Gas rate",
    description: "Field total",
    icon: FlameIcon,
    body: GasRate,
    ...KPI,
  },
  uptime: {
    name: "Uptime",
    description: "30 days",
    icon: ActivityIcon,
    body: Uptime,
    ...KPI,
  },
  pressure: {
    name: "Wellhead pressure",
    description: "B-3",
    icon: GaugeIcon,
    body: Pressure,
    size: { w: 4, h: 3 },
    min: { w: 3, h: 3 },
    presets: {
      Small: { w: 4, h: 3 },
      Medium: { w: 6, h: 3 },
      Large: { w: 8, h: 3 },
    },
  },
  alarms: {
    name: "Alarms",
    description: "4 open",
    icon: BellIcon,
    body: Alarms,
    size: { w: 4, h: 3 },
    min: { w: 4, h: 2 },
    presets: {
      Small: { w: 4, h: 3 },
      Medium: { w: 6, h: 3 },
      Large: { w: 8, h: 4 },
    },
    list: true,
  },
  water: {
    name: "Water cut",
    description: "By well, %",
    icon: WavesIcon,
    body: WaterCut,
    size: { w: 4, h: 4 },
    min: { w: 3, h: 4 },
    presets: {
      Small: { w: 4, h: 4 },
      Medium: { w: 6, h: 4 },
      Large: { w: 8, h: 4 },
    },
    list: true,
  },
  tanks: {
    name: "Tank levels",
    description: "Pad 2",
    icon: CylinderIcon,
    body: Tanks,
    size: { w: 4, h: 3 },
    min: { w: 3, h: 3 },
    presets: {
      Small: { w: 4, h: 3 },
      Medium: { w: 6, h: 3 },
      Large: { w: 8, h: 3 },
    },
    list: true,
  },
  job: {
    name: "Next job",
    description: "Rig 2",
    icon: CalendarClockIcon,
    body: NextJob,
    ...KPI,
  },
  flaring: {
    name: "Flaring",
    description: "Today",
    icon: FlameKindlingIcon,
    body: Flaring,
    ...KPI,
  },
}

const entry = (id: string, x: number, y: number, w: number, h: number) => ({
  id,
  x,
  y,
  w,
  h,
  minW: WIDGETS[id].min.w,
  minH: WIDGETS[id].min.h,
})

const DEFAULT_LAYOUT: Array<WidgetGridLayoutItem> = [
  entry("production", 0, 0, 8, 3),
  entry("alarms", 8, 0, 4, 3),
  entry("oil", 0, 3, 4, 2),
  entry("gas", 4, 3, 4, 2),
  entry("uptime", 8, 3, 4, 2),
  entry("pressure", 0, 5, 4, 3),
  entry("tanks", 4, 5, 4, 3),
  entry("job", 8, 5, 4, 3),
]

/** A size given for 12 columns, in `columns`. */
const across = (columns: number, w: number) =>
  Math.max(1, Math.round((w * columns) / 12))

/** The layout for another number of columns: the same shape, scaled. */
function rescale(
  layout: ReadonlyArray<WidgetGridLayoutItem>,
  from: number,
  to: number
) {
  const scale = (n: number) => Math.round((n * to) / from)
  return layout.map((item) => ({
    ...item,
    x: scale(item.x),
    w: Math.max(1, scale(item.w)),
    minW: item.minW === undefined ? undefined : Math.max(1, scale(item.minW)),
  }))
}

// --- The dashboard -----------------------------------------------------------

/** Size presets and single-press moves: the way to arrange without dragging. */
function WidgetMenu({ widget, columns }: { widget: Widget; columns: number }) {
  const item = useWidgetGridItem()
  const presets = Object.entries(widget.presets).map(
    ([name, size]) => [name, { w: across(columns, size.w), h: size.h }] as const
  )
  const preset =
    presets.find(
      ([, size]) => size.w === item.layout?.w && size.h === item.layout.h
    )?.[0] ?? ""
  const moves = [
    { direction: "up", label: "Move up", icon: ArrowUpIcon },
    { direction: "down", label: "Move down", icon: ArrowDownIcon },
    { direction: "left", label: "Move left", icon: ArrowLeftIcon },
    { direction: "right", label: "Move right", icon: ArrowRightIcon },
  ] as const
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`${widget.name} options`}
            className="text-muted-foreground"
          />
        }
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Size</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={preset}
            onValueChange={(name) => {
              const size = presets.find(([key]) => key === name)?.[1]
              if (size) item.resize(size)
            }}
          >
            {presets.map(([name, size]) => (
              <DropdownMenuRadioItem key={name} value={name}>
                {name}
                <span
                  dir="ltr"
                  className="ms-auto font-mono text-xs text-muted-foreground"
                >
                  {size.w}×{size.h}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {moves.map(({ direction, label, icon: Icon }) => (
            <DropdownMenuItem
              key={direction}
              disabled={!item.canMove(direction)}
              onClick={() => item.move(direction)}
            >
              <Icon />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={item.remove}>
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type Grid = { columns: number; rowHeight: number; gap: number }

const sliderValue = (value: number | ReadonlyArray<number>) =>
  typeof value === "number" ? value : (value[0] ?? 0)

/** The grid's size: columns, row height and gap. */
function GridSettings({
  grid,
  onGridChange,
}: {
  grid: Grid
  onGridChange: (grid: Grid) => void
}) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
        <Grid3x3Icon />
        Grid
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>Grid</PopoverTitle>
        </PopoverHeader>
        <FieldGroup className="gap-5">
          <Field>
            <FieldTitle id="widget-grid-columns">Columns</FieldTitle>
            <ToggleGroup
              aria-labelledby="widget-grid-columns"
              variant="outline"
              size="sm"
              value={[String(grid.columns)]}
              onValueChange={(value) => {
                const columns = Number(value.at(0))
                if (columns) onGridChange({ ...grid, columns })
              }}
            >
              <ToggleGroupItem value="12">12</ToggleGroupItem>
              <ToggleGroupItem value="24">24</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldTitle id="widget-grid-row-height">Row height</FieldTitle>
            <Slider
              aria-labelledby="widget-grid-row-height"
              min={32}
              max={96}
              step={4}
              value={[grid.rowHeight]}
              onValueChange={(value) =>
                onGridChange({ ...grid, rowHeight: sliderValue(value) })
              }
            />
            <FieldDescription>{grid.rowHeight} px</FieldDescription>
          </Field>
          <Field>
            <FieldTitle id="widget-grid-gap">Gap</FieldTitle>
            <Slider
              aria-labelledby="widget-grid-gap"
              min={0}
              max={32}
              step={2}
              value={[grid.gap]}
              onValueChange={(value) =>
                onGridChange({ ...grid, gap: sliderValue(value) })
              }
            />
            <FieldDescription>{grid.gap} px</FieldDescription>
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  )
}

/**
 * One widget. Memoized with its body: a change to the layout re-renders the
 * grid's placement of each widget, never what the widgets show.
 */
const Widget = React.memo(function Widget({
  id,
  editing,
  columns,
}: {
  id: string
  editing: boolean
  columns: number
}) {
  const widget = WIDGETS[id]
  const Body = widget.body
  return (
    <WidgetGridItem value={id} label={widget.name} render={<Panel size="sm" />}>
      <PanelHeader>
        <WidgetGridHandle />
        <PanelTitle>{widget.name}</PanelTitle>
        <PanelActions>
          {editing && <WidgetMenu widget={widget} columns={columns} />}
          <WidgetGridRemove />
        </PanelActions>
        <PanelDescription>{widget.description}</PanelDescription>
      </PanelHeader>
      <PanelContent
        className={`@container flex flex-col ${widget.list ? "" : "justify-end-safe"}`}
      >
        <Body />
      </PanelContent>
      <WidgetGridResizeHandle />
    </WidgetGridItem>
  )
})

export default function WidgetGridDemo() {
  const [layout, setLayout] = React.useState(DEFAULT_LAYOUT)
  const [editing, setEditing] = React.useState(false)
  const [grid, setGrid] = React.useState<Grid>({
    columns: 12,
    rowHeight: 52,
    gap: 12,
  })
  // What the edit started from: Cancel goes back to it.
  const draft = React.useRef({ layout, grid })

  const changeGrid = (next: Grid) => {
    if (next.columns !== grid.columns)
      setLayout((current) => rescale(current, grid.columns, next.columns))
    setGrid(next)
  }

  return (
    <WidgetGrid
      value={layout}
      onValueChange={(next, { reason, item }) => {
        const previous = layout
        setLayout(next)
        if (reason === "remove")
          toast(`${WIDGETS[item].name} removed`, {
            action: { label: "Undo", onClick: () => setLayout(previous) },
          })
      }}
      editable={editing}
      columns={grid.columns}
      rowHeight={grid.rowHeight}
      gap={grid.gap}
      stackBelow={520}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="me-auto">
          <h3 className="text-sm font-medium">Gullfaks field</h3>
          <p className="text-xs text-muted-foreground">
            {editing
              ? "Drag the grips to move, the corners to resize."
              : "Live · updated every second"}
          </p>
        </div>
        {editing ? (
          <>
            <GridSettings grid={grid} onGridChange={changeGrid} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setLayout(rescale(DEFAULT_LAYOUT, 12, grid.columns))
              }
            >
              <RotateCcwIcon />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLayout(draft.current.layout)
                setGrid(draft.current.grid)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={() => setEditing(false)}>
              <CheckIcon />
              Done
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              draft.current = { layout, grid }
              setEditing(true)
            }}
          >
            <PencilIcon />
            Edit layout
          </Button>
        )}
      </div>

      {editing && (
        <Panel variant="flat" size="sm" className="bg-muted/50">
          <PanelContent className="flex flex-wrap items-center gap-1.5">
            <span className="me-1 text-xs font-medium text-muted-foreground">
              Add
            </span>
            {Object.entries(WIDGETS).map(([id, widget]) => (
              <WidgetGridSource
                key={id}
                value={id}
                label={widget.name}
                w={across(grid.columns, widget.size.w)}
                h={widget.size.h}
                minW={across(grid.columns, widget.min.w)}
                minH={widget.min.h}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs font-medium shadow-xs transition-colors hover:bg-accent disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:text-muted-foreground"
              >
                <widget.icon />
                {widget.name}
              </WidgetGridSource>
            ))}
          </PanelContent>
        </Panel>
      )}

      <WidgetGridContent>
        {layout.length === 0 && (
          <Empty className="col-span-full row-span-4 row-start-1 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutGridIcon />
              </EmptyMedia>
              <EmptyTitle>No widgets</EmptyTitle>
              <EmptyDescription>
                {editing
                  ? "Press a widget above to add it, or drag it here."
                  : "Edit the layout to add widgets."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {layout.map(({ id }) => (
          <Widget key={id} id={id} editing={editing} columns={grid.columns} />
        ))}
      </WidgetGridContent>
    </WidgetGrid>
  )
}
