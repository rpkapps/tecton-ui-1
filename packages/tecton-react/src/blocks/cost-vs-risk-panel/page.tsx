"use client"

import * as React from "react"
import { cn } from "cn"
import { CrownIcon, PanelRightIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Chip } from "@tecton/react/tecton/chip"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"
import {
  SelectField,
  SelectFieldItem,
} from "@tecton/react/tecton/select-field"

import { ComparisonList } from "./components/comparison-list"
import { QuadrantChart } from "./components/quadrant-chart"
import { axisOptions, designs as allDesigns, metrics, type DesignPoint } from "./data"

type CostVsRiskPanelProps = Omit<React.ComponentProps<typeof Panel>, "children"> & {
  designs?: DesignPoint[]
  defaultSelected?: string[]
  onCollapse?: () => void
}

/**
 * Cost vs risk panel — quadrant bubble chart, legend chips that toggle the
 * compared designs, and a bar-list breakdown of cost and risk categories.
 */
function CostVsRiskPanel({
  className,
  designs = allDesigns,
  defaultSelected = ["initial", "liner"],
  onCollapse,
  ...props
}: CostVsRiskPanelProps) {
  const [selected, setSelected] = React.useState<string[]>(defaultSelected)
  const [xAxis, setXAxis] = React.useState("cost")
  const [yAxis, setYAxis] = React.useState("risk")

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.length > 1
          ? current.filter((item) => item !== id)
          : current
        : [...current, id]
    )

  const xLabel = axisOptions.find((option) => option.id === xAxis)?.label ?? "Cost"
  const yLabel = axisOptions.find((option) => option.id === yAxis)?.label ?? "Risk"

  return (
    <Panel
      data-slot="cost-vs-risk-panel"
      className={cn("h-full", className)}
      {...props}
    >
      <PanelHeader>
        <PanelTitle className="text-base">
          {selected.length} Selected
        </PanelTitle>
        <PanelActions>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse panel"
            onPress={onCollapse}
          >
            <PanelRightIcon />
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Compare</span>
          <SelectField
            aria-label="X axis"
            variant="filled"
            size="sm"
            className="w-28"
            selectedKey={xAxis}
            onSelectionChange={(key) => setXAxis(String(key))}
          >
            {axisOptions.map((option) => (
              <SelectFieldItem key={option.id} id={option.id} textValue={option.label}>
                {option.label}
              </SelectFieldItem>
            ))}
          </SelectField>
          <span>and</span>
          <SelectField
            aria-label="Y axis"
            variant="filled"
            size="sm"
            className="w-28"
            selectedKey={yAxis}
            onSelectionChange={(key) => setYAxis(String(key))}
          >
            {axisOptions.map((option) => (
              <SelectFieldItem key={option.id} id={option.id} textValue={option.label}>
                {option.label}
              </SelectFieldItem>
            ))}
          </SelectField>
        </div>

        <QuadrantChart
          designs={designs}
          selected={selected}
          xLabel={xLabel}
          yLabel={yLabel}
        />

        <div
          data-slot="cost-vs-risk-legend"
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Designs"
        >
          {designs.map((design) => {
            const active = selected.includes(design.id)
            return (
              <Chip
                key={design.id}
                size="sm"
                variant={active ? "filled" : "outlined"}
                aria-pressed={active}
                onPress={() => toggle(design.id)}
              >
                <span
                  aria-hidden
                  className="size-2 rounded-[2px]"
                  style={{ background: design.color, opacity: active ? 1 : 0.6 }}
                />
                {design.name}
                {design.isRecommended && <CrownIcon className="size-3" />}
              </Chip>
            )
          })}
        </div>

        <ComparisonList metrics={metrics} designs={designs} selected={selected} />
      </PanelContent>
    </Panel>
  )
}

/** Route-ready page: the panel docked on the right of an empty canvas. */
export default function CostVsRiskPanelPage() {
  return (
    <div
      data-slot="cost-vs-risk-panel-page"
      className="flex h-svh w-full bg-background text-foreground"
    >
      <div className="hidden min-w-0 flex-1 items-center justify-center p-6 text-sm text-muted-foreground md:flex">
        Well design comparison
      </div>
      <div className="flex h-full w-full max-w-md shrink-0 flex-col border-l border-border-subtle">
        <CostVsRiskPanel variant="flat" className="rounded-none border-0" />
      </div>
    </div>
  )
}

export { CostVsRiskPanel, QuadrantChart, ComparisonList }
export { designs, metrics, axisOptions, riskLabel } from "./data"
export type { CostVsRiskPanelProps }
export type { DesignPoint, Metric, MetricCategory, MetricValue } from "./data"
