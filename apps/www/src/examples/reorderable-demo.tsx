"use client"

import * as React from "react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@tecton/react/components/item"
import {
  Reorderable,
  ReorderableHandle,
  ReorderableItem,
} from "@tecton/react/tecton/reorderable"

const STEPS = [
  { id: "rig-up", name: "Rig up", detail: "Skid the rig over slot A-12" },
  { id: "surface", name: "Surface section", detail: "26 in to 1,200 m" },
  { id: "bop", name: "Install BOP", detail: "Pressure test to 690 bar" },
  {
    id: "intermediate",
    name: "Intermediate section",
    detail: "17½ in to 2,450 m",
  },
  {
    id: "logging",
    name: "Wireline logging",
    detail: "Resistivity and density",
  },
]

export default function ReorderableDemo() {
  const [steps, setSteps] = React.useState(STEPS)

  return (
    <Reorderable
      value={steps.map((step) => step.id)}
      onValueChange={(order) =>
        setSteps((all) => order.map((id) => all.find((s) => s.id === id)!))
      }
      render={<ItemGroup className="w-full max-w-md gap-2" />}
    >
      {steps.map((step, index) => (
        <ReorderableItem
          key={step.id}
          value={step.id}
          label={step.name}
          render={<Item variant="outline" size="sm" />}
        >
          <ItemContent>
            <ItemTitle>
              <span className="font-mono text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              {step.name}
            </ItemTitle>
            <ItemDescription>{step.detail}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ReorderableHandle />
          </ItemActions>
        </ReorderableItem>
      ))}
    </Reorderable>
  )
}
