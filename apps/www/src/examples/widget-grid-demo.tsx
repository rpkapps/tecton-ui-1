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
  LayoutGridIcon,
  PencilIcon,
  RotateCcwIcon,
  TrendingUpIcon,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
} from "recharts"
import { toast } from "sonner"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@tecton/react/components/chart"
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

const PRODUCTION = [
  { day: "Mon", oil: 11840, gas: 9120 },
  { day: "Tue", oil: 12010, gas: 9340 },
  { day: "Wed", oil: 11720, gas: 9010 },
  { day: "Thu", oil: 12260, gas: 9480 },
  { day: "Fri", oil: 12390, gas: 9610 },
  { day: "Sat", oil: 12180, gas: 9550 },
  { day: "Sun", oil: 12480, gas: 9720 },
]

const PRESSURE = [
  182, 184, 183, 187, 186, 189, 186, 185, 188, 186, 184, 186,
].map((bar, index) => ({
  hour: `${String(index * 2).padStart(2, "0")}:00`,
  bar,
}))

const WATER_CUT = [
  { well: "A-12", cut: 18 },
  { well: "B-3", cut: 31 },
  { well: "C-7", cut: 24 },
  { well: "D-1", cut: 42 },
  { well: "E-9", cut: 12 },
]

const productionConfig = {
  oil: { label: "Oil (bbl/d)", color: "var(--chart-1)" },
  gas: { label: "Gas (Mscf/d)", color: "var(--chart-2)" },
} satisfies ChartConfig
const pressureConfig = {
  bar: { label: "Wellhead (bar)", color: "var(--chart-3)" },
} satisfies ChartConfig
const waterConfig = {
  cut: { label: "Water cut (%)", color: "var(--chart-4)" },
} satisfies ChartConfig

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

/** A chart fills its widget, whatever size the widget is given. */
const FILL = "aspect-auto size-full min-h-0"

type Widget = {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  /** The size a new one gets, and its size presets. */
  size: { w: number; h: number }
  minW?: number
  minH?: number
  presets: Record<"Small" | "Medium" | "Large", { w: number; h: number }>
  /** A list reads from the top; a figure sits at the bottom. */
  list?: boolean
  content: React.ReactNode
}

const WIDGETS: Record<string, Widget> = {
  production: {
    name: "Production",
    description: "Last 7 days",
    icon: TrendingUpIcon,
    size: { w: 8, h: 4 },
    minW: 4,
    minH: 3,
    presets: {
      Small: { w: 6, h: 3 },
      Medium: { w: 8, h: 4 },
      Large: { w: 12, h: 5 },
    },
    content: (
      <ChartContainer config={productionConfig} className={FILL}>
        <AreaChart
          accessibilityLayer
          data={PRODUCTION}
          margin={{ left: 4, right: 4 }}
        >
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            dataKey="gas"
            type="monotone"
            fill="var(--color-gas)"
            fillOpacity={0.2}
            stroke="var(--color-gas)"
            strokeWidth={2}
          />
          <Area
            dataKey="oil"
            type="monotone"
            fill="var(--color-oil)"
            fillOpacity={0.25}
            stroke="var(--color-oil)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    ),
  },
  oil: {
    name: "Oil rate",
    description: "Field total",
    icon: DropletsIcon,
    size: { w: 4, h: 2 },
    minW: 3,
    minH: 2,
    presets: {
      Small: { w: 4, h: 2 },
      Medium: { w: 6, h: 2 },
      Large: { w: 6, h: 3 },
    },
    content: (
      <Stat>
        <StatValue unit="bbl/d">12,480</StatValue>
        <StatDelta trend="up">
          +3.2%
          <span className="hidden @min-[14rem]:inline"> vs. last week</span>
        </StatDelta>
      </Stat>
    ),
  },
  gas: {
    name: "Gas rate",
    description: "Field total",
    icon: FlameIcon,
    size: { w: 4, h: 2 },
    minW: 3,
    minH: 2,
    presets: {
      Small: { w: 4, h: 2 },
      Medium: { w: 6, h: 2 },
      Large: { w: 6, h: 3 },
    },
    content: (
      <Stat>
        <StatValue unit="MMscf/d">38.2</StatValue>
        <StatDelta trend="down" tone="negative">
          −0.8%
          <span className="hidden @min-[14rem]:inline"> vs. last week</span>
        </StatDelta>
      </Stat>
    ),
  },
  pressure: {
    name: "Wellhead pressure",
    description: "B-3 · last 24 hours",
    icon: GaugeIcon,
    size: { w: 8, h: 3 },
    minW: 4,
    minH: 3,
    presets: {
      Small: { w: 6, h: 3 },
      Medium: { w: 8, h: 3 },
      Large: { w: 12, h: 4 },
    },
    content: (
      <ChartContainer config={pressureConfig} className={FILL}>
        <LineChart
          accessibilityLayer
          data={PRESSURE}
          margin={{ left: 4, right: 4, top: 4 }}
        >
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            minTickGap={24}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="bar"
            type="monotone"
            stroke="var(--color-bar)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    ),
  },
  alarms: {
    name: "Alarms",
    description: "4 open",
    icon: BellIcon,
    size: { w: 4, h: 4 },
    minW: 4,
    minH: 2,
    presets: {
      Small: { w: 4, h: 3 },
      Medium: { w: 4, h: 4 },
      Large: { w: 8, h: 4 },
    },
    list: true,
    content: (
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
    ),
  },
  uptime: {
    name: "Uptime",
    description: "30 days",
    icon: ActivityIcon,
    size: { w: 4, h: 2 },
    minW: 3,
    minH: 2,
    presets: {
      Small: { w: 4, h: 2 },
      Medium: { w: 6, h: 2 },
      Large: { w: 6, h: 3 },
    },
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
  water: {
    name: "Water cut",
    description: "By well",
    icon: DropletsIcon,
    size: { w: 4, h: 3 },
    minW: 4,
    minH: 3,
    presets: {
      Small: { w: 4, h: 3 },
      Medium: { w: 6, h: 3 },
      Large: { w: 8, h: 4 },
    },
    content: (
      <ChartContainer config={waterConfig} className={FILL}>
        <BarChart accessibilityLayer data={WATER_CUT}>
          <XAxis
            dataKey="well"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
          />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="cut" fill="var(--color-cut)" radius={4} />
        </BarChart>
      </ChartContainer>
    ),
  },
  job: {
    name: "Next job",
    description: "Rig 2",
    icon: CalendarClockIcon,
    size: { w: 4, h: 2 },
    minW: 3,
    minH: 2,
    presets: {
      Small: { w: 4, h: 2 },
      Medium: { w: 6, h: 2 },
      Large: { w: 6, h: 3 },
    },
    content: (
      <div className="grid min-w-0 gap-1">
        <span className="truncate font-medium">Wireline logging</span>
        <span className="text-xs text-muted-foreground">
          14 Nov, 06:00 · C-7
        </span>
      </div>
    ),
  },
  tanks: {
    name: "Tank levels",
    description: "Pad 2",
    icon: CylinderIcon,
    size: { w: 4, h: 4 },
    minW: 4,
    minH: 3,
    presets: {
      Small: { w: 4, h: 3 },
      Medium: { w: 4, h: 4 },
      Large: { w: 6, h: 4 },
    },
    list: true,
    content: (
      <div className="grid gap-3">
        <Meter aria-label="Oil tank" label="Oil" value={72} showValue />
        <Meter
          aria-label="Water tank"
          label="Water"
          value={88}
          color="warning"
          showValue
        />
        <Meter
          aria-label="Chemicals"
          label="Chemicals"
          value={14}
          color="error"
          showValue
        />
      </div>
    ),
  },
  flaring: {
    name: "Flaring",
    description: "Today",
    icon: FlameKindlingIcon,
    size: { w: 4, h: 2 },
    minW: 3,
    minH: 2,
    presets: {
      Small: { w: 4, h: 2 },
      Medium: { w: 6, h: 2 },
      Large: { w: 6, h: 3 },
    },
    content: (
      <Stat>
        <StatValue unit="Mscf">410</StatValue>
        <StatDelta trend="down">−12%</StatDelta>
      </Stat>
    ),
  },
}

const DEFAULT_LAYOUT: Array<WidgetGridLayoutItem> = [
  { id: "oil", x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
  { id: "gas", x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
  { id: "uptime", x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
  { id: "production", x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
  { id: "alarms", x: 8, y: 2, w: 4, h: 4, minW: 4, minH: 2 },
  { id: "pressure", x: 0, y: 6, w: 8, h: 3, minW: 4, minH: 3 },
  { id: "job", x: 8, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
]

/** Size presets and single-press moves: the way to arrange without dragging. */
function WidgetMenu({ widget }: { widget: Widget }) {
  const item = useWidgetGridItem()
  const preset =
    Object.entries(widget.presets).find(
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
            onValueChange={(name) =>
              item.resize(widget.presets[name as keyof Widget["presets"]])
            }
          >
            {Object.entries(widget.presets).map(([name, size]) => (
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

export default function WidgetGridDemo() {
  const [layout, setLayout] = React.useState(DEFAULT_LAYOUT)
  const [editing, setEditing] = React.useState(false)
  // The layout the edit started from: Cancel goes back to it.
  const draft = React.useRef(layout)

  const startEditing = () => {
    draft.current = layout
    setEditing(true)
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
      rowHeight={52}
      stackBelow={520}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="me-auto">
          <h3 className="text-sm font-medium">Gullfaks field</h3>
          <p className="text-xs text-muted-foreground">
            {editing
              ? "Drag the grips to move, the corners to resize."
              : "Updated 2 minutes ago"}
          </p>
        </div>
        {editing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayout(DEFAULT_LAYOUT)}
            >
              <RotateCcwIcon />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLayout(draft.current)
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
          <Button variant="outline" size="sm" onClick={startEditing}>
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
                w={widget.size.w}
                h={widget.size.h}
                minW={widget.minW}
                minH={widget.minH}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs font-medium shadow-xs transition-colors hover:bg-accent disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:text-muted-foreground"
              >
                <widget.icon />
                {widget.name}
              </WidgetGridSource>
            ))}
          </PanelContent>
        </Panel>
      )}

      <WidgetGridContent className="gap-3">
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
        {layout.map(({ id }) => {
          const widget = WIDGETS[id]
          return (
            <WidgetGridItem
              key={id}
              value={id}
              label={widget.name}
              render={<Panel size="sm" />}
            >
              <PanelHeader>
                <WidgetGridHandle />
                <PanelTitle>{widget.name}</PanelTitle>
                <PanelActions>
                  {editing && <WidgetMenu widget={widget} />}
                  <WidgetGridRemove />
                </PanelActions>
                <PanelDescription>{widget.description}</PanelDescription>
              </PanelHeader>
              <PanelContent
                className={`@container flex flex-col ${widget.list ? "" : "justify-end-safe"}`}
              >
                {widget.content}
              </PanelContent>
              <WidgetGridResizeHandle />
            </WidgetGridItem>
          )
        })}
      </WidgetGridContent>
    </WidgetGrid>
  )
}
