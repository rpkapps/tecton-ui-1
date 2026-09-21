"use client"

import * as React from "react"
import {
  EditSquareIcon,
  PanToolIcon,
  RulerIcon,
  SelectCursorIcon,
  ShapesIcon,
  TextIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@tecton/react/components/dropdown-menu"
import { Toggle } from "@tecton/react/components/toggle"
import {
  OverflowDivider,
  OverflowItem,
  OverflowSpacer,
  Toolbar,
} from "@tecton/react/tecton/overflow"

const tools = [
  { id: "select", label: "Select", icon: SelectCursorIcon, priority: 3 },
  { id: "pan", label: "Pan", icon: PanToolIcon, priority: 2 },
  { id: "draw", label: "Draw", icon: EditSquareIcon, priority: 1 },
  { id: "shape", label: "Shape", icon: ShapesIcon },
  { id: "text", label: "Text", icon: TextIcon },
  { id: "measure", label: "Measure", icon: RulerIcon },
]

export default function OverflowVertical() {
  const [tool, setTool] = React.useState("select")

  return (
    <div className="flex flex-col gap-2">
      {/* Drag the bottom edge: a vertical row measures heights, and the More
          menu sits at the bottom and opens to the side. */}
      <div className="h-80 min-h-32 w-fit resize-y overflow-hidden rounded-md border p-1">
        <Toolbar
          aria-label="Tools"
          orientation="vertical"
          labels="never"
          className="h-full"
        >
          {/* The tools are one single-selection group: each becomes a radio item in the menu. */}
          {tools.map(({ id, label, icon: Icon, priority }) => (
            <OverflowItem
              key={id}
              id={id}
              label={label}
              priority={priority}
              overflow={
                <DropdownMenuGroup
                  selectionMode="single"
                  selectedKeys={[tool]}
                  onSelectionChange={(keys) => {
                    const next = [...keys][0]
                    if (next) setTool(String(next))
                  }}
                >
                  <DropdownMenuItem id={id}>
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              }
            >
              <Toggle
                aria-label={label}
                isSelected={tool === id}
                onChange={() => setTool(id)}
              >
                <Icon />
              </Toggle>
            </OverflowItem>
          ))}
          <OverflowDivider />
          <OverflowSpacer />
          {/* Unwrapped: the zoom buttons never leave the rail. */}
          <Button variant="ghost" size="icon" aria-label="Zoom in">
            <ZoomInIcon />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Zoom out">
            <ZoomOutIcon />
          </Button>
        </Toolbar>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the bottom edge to resize. Tool: {tool}
      </p>
    </div>
  )
}
