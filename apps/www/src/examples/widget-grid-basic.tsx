"use client"

import * as React from "react"

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
  WidgetGridRemove,
  WidgetGridResizeHandle,
  type WidgetGridLayoutItem,
} from "@tecton/react/tecton/widget-grid"

const NAMES: Record<string, string> = {
  production: "Production",
  pressure: "Pressure",
  alarms: "Alarms",
  uptime: "Uptime",
}

export default function WidgetGridBasic() {
  const [layout, setLayout] = React.useState<Array<WidgetGridLayoutItem>>([
    { id: "production", x: 0, y: 0, w: 8, h: 2 },
    { id: "pressure", x: 8, y: 0, w: 4, h: 2 },
    { id: "alarms", x: 0, y: 2, w: 4, h: 2 },
    { id: "uptime", x: 4, y: 2, w: 8, h: 2 },
  ])
  return (
    <WidgetGrid
      value={layout}
      onValueChange={setLayout}
      rowHeight={56}
      gap={3}
      stackBelow={400}
      className="w-full"
    >
      <WidgetGridContent>
        {layout.map(({ id, w, h }) => (
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
            <PanelContent className="font-mono text-xs text-muted-foreground">
              <span dir="ltr">
                {w} × {h}
              </span>
            </PanelContent>
            <WidgetGridResizeHandle />
          </WidgetGridItem>
        ))}
      </WidgetGridContent>
    </WidgetGrid>
  )
}
