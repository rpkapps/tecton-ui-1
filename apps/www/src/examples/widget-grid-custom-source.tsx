"use client"

import * as React from "react"
import {
  ActivityIcon,
  BellIcon,
  CheckIcon,
  CloudSunIcon,
  GaugeIcon,
  GripVerticalIcon,
  HardHatIcon,
} from "lucide-react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@tecton/react/components/item"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"
import {
  WidgetGrid,
  WidgetGridContent,
  WidgetGridHandle,
  WidgetGridItem,
  WidgetGridPlaceholder,
  WidgetGridRemove,
  WidgetGridResizeHandle,
  useWidgetGridSource,
  type WidgetGridLayoutItem,
} from "@tecton/react/tecton/widget-grid"

const LIBRARY = [
  {
    id: "pressure",
    name: "Wellhead pressure",
    note: "Against its limit",
    icon: GaugeIcon,
    w: 6,
    h: 2,
  },
  {
    id: "uptime",
    name: "Uptime",
    note: "30 days",
    icon: ActivityIcon,
    w: 4,
    h: 2,
  },
  {
    id: "alarms",
    name: "Alarms",
    note: "Open, by severity",
    icon: BellIcon,
    w: 4,
    h: 3,
  },
  {
    id: "crew",
    name: "Crew on site",
    note: "People on board",
    icon: HardHatIcon,
    w: 4,
    h: 2,
  },
  {
    id: "weather",
    name: "Weather",
    note: "Wind and waves",
    icon: CloudSunIcon,
    w: 4,
    h: 2,
  },
]

const NAMES = Object.fromEntries(LIBRARY.map((entry) => [entry.id, entry.name]))

/** A row of the library, made a source: drag it onto the grid, or press it. */
function LibraryItem({ entry }: { entry: (typeof LIBRARY)[number] }) {
  const source = useWidgetGridSource({
    value: entry.id,
    label: entry.name,
    w: entry.w,
    h: entry.h,
  })
  return (
    <Item
      variant="outline"
      size="sm"
      {...source.getSourceProps({
        className:
          "cursor-grab select-none bg-card transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ring data-dragging:opacity-50 data-disabled:cursor-default data-disabled:opacity-60",
      })}
    >
      <ItemMedia variant="icon">
        <entry.icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{entry.name}</ItemTitle>
        <ItemDescription>{entry.note}</ItemDescription>
      </ItemContent>
      <ItemActions className="text-muted-foreground">
        {source.onGrid ? (
          <CheckIcon className="size-4" />
        ) : (
          <GripVerticalIcon className="size-4" />
        )}
      </ItemActions>
    </Item>
  )
}

export default function WidgetGridCustomSource() {
  const [layout, setLayout] = React.useState<Array<WidgetGridLayoutItem>>([
    { id: "pressure", x: 0, y: 0, w: 6, h: 2 },
  ])
  return (
    <WidgetGrid
      value={layout}
      onValueChange={setLayout}
      rowHeight={48}
      gap={3}
      stackBelow={400}
      className="flex w-full flex-col gap-3"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {LIBRARY.map((entry) => (
          <LibraryItem key={entry.id} entry={entry} />
        ))}
      </div>
      <WidgetGridContent>
        {layout.map(({ id }) => (
          <WidgetGridItem
            key={id}
            value={id}
            label={NAMES[id]}
            render={<Panel size="sm" />}
          >
            <PanelHeader>
              <WidgetGridHandle />
              <PanelTitle>{NAMES[id]}</PanelTitle>
              <PanelActions>
                <WidgetGridRemove />
              </PanelActions>
            </PanelHeader>
            <PanelContent />
            <WidgetGridResizeHandle />
          </WidgetGridItem>
        ))}
        {/* Where a widget dragged in will land, with its name and size. */}
        <WidgetGridPlaceholder className="flex items-center justify-center gap-2 border-solid bg-[color-mix(in_oklab,var(--primary)_14%,var(--background))] text-sm font-medium text-foreground">
          {({ label, w, h }) => (
            <>
              {label}
              <span dir="ltr" className="font-mono text-xs opacity-70">
                {w}×{h}
              </span>
            </>
          )}
        </WidgetGridPlaceholder>
      </WidgetGridContent>
    </WidgetGrid>
  )
}
