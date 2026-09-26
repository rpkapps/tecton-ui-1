"use client"

import * as React from "react"
import { cn } from "cn"
import {
  CircleCheckIcon,
  PanelLeftOpenIcon,
  PanelRightIcon,
  PlayIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { Button } from "@tecton/react/components/button"
import { Spinner } from "@tecton/react/components/spinner"
import {
  Panel,
  PanelActions,
  PanelContent,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"
import { useLocale } from "@tecton/react/tecton/provider"

import { FaciesForm } from "./components/facies-form"
import { ParameterSlider } from "./components/parameter-slider"
import { defaultFaciesSettings } from "./data"
import type { FaciesSettings } from "./data"

type FaciesModelingPanelProps = Omit<
  React.ComponentProps<typeof Panel>,
  "children"
> & {
  initialSettings?: FaciesSettings
  onRun?: (value: FaciesSettings) => void
  onCollapse?: () => void
}

/**
 * Facies modelling (SEM) tool panel — method/seed selects, labelled
 * variogram sliders with mono readouts, option checkboxes and a
 * Run model / Reset footer.
 */
function FaciesModelingPanel({
  className,
  initialSettings = defaultFaciesSettings,
  onRun,
  onCollapse,
  ...props
}: FaciesModelingPanelProps) {
  const [value, setValue] = React.useState<FaciesSettings>(initialSettings)
  const [running, setRunning] = React.useState(false)
  const [lastRun, setLastRun] = React.useState<string | null>(null)
  const { locale } = useLocale()

  const total = value.lithotypes.reduce((sum, item) => sum + item.density, 0)
  const invalid = total !== 100

  const run = () => {
    setRunning(true)
    onRun?.(value)
    window.setTimeout(() => {
      setRunning(false)
      setLastRun(
        new Date().toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })
      )
    }, 1200)
  }

  return (
    <Panel
      data-slot="facies-modeling-panel"
      className={cn("h-full", className)}
      {...props}
    >
      <PanelHeader>
        <PanelTitle>Facies Modeling</PanelTitle>
        <PanelActions>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse panel"
            {...(onCollapse === undefined ? {} : { onClick: onCollapse })}
          >
            <PanelRightIcon />
          </Button>
        </PanelActions>
      </PanelHeader>
      <PanelContent className="flex flex-col gap-4">
        {invalid && (
          <Alert variant="warning" appearance="outline">
            <TriangleAlertIcon />
            <AlertTitle>Proportions must sum to 100%</AlertTitle>
            <AlertDescription>
              Lithotype densities currently total {total}%.
            </AlertDescription>
          </Alert>
        )}
        {lastRun && !invalid && (
          <Alert variant="success" appearance="outline">
            <CircleCheckIcon />
            <AlertTitle>Model generated</AlertTitle>
            <AlertDescription>
              {value.realizations} realizations written at {lastRun}.
            </AlertDescription>
            <AlertAction>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Dismiss"
                onClick={() => setLastRun(null)}
              >
                <XIcon />
              </Button>
            </AlertAction>
          </Alert>
        )}
        <FaciesForm value={value} onChange={setValue} />
      </PanelContent>
      <PanelFooter className="justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={running}
          onClick={() => setValue(initialSettings)}
        >
          Reset
        </Button>
        <Button size="sm" disabled={running || invalid} onClick={run}>
          {running ? <Spinner /> : <PlayIcon />}
          {running ? "Running…" : "Run model"}
        </Button>
      </PanelFooter>
    </Panel>
  )
}

/** Route-ready page: the panel docked to the left of an empty canvas. */
export default function FaciesModelingPanelPage() {
  const [open, setOpen] = React.useState(true)

  return (
    <div
      data-slot="facies-modeling-panel-page"
      className="flex h-svh w-full bg-background text-foreground"
    >
      {open ? (
        <div className="flex h-full w-full max-w-sm shrink-0 flex-col border-e border-border-subtle">
          <FaciesModelingPanel
            variant="flat"
            className="rounded-none border-0"
            onCollapse={() => setOpen(false)}
          />
        </div>
      ) : (
        <div className="flex h-full shrink-0 flex-col border-e border-border-subtle p-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Expand facies modeling panel"
            onClick={() => setOpen(true)}
          >
            <PanelLeftOpenIcon />
          </Button>
        </div>
      )}
      <div className="hidden min-w-0 flex-1 items-center justify-center p-6 text-sm text-muted-foreground md:flex">
        3D viewport
      </div>
    </div>
  )
}

export { FaciesModelingPanel, FaciesForm, ParameterSlider }
export {
  defaultFaciesSettings,
  faciesTemplates,
  methods,
  densityLabel,
} from "./data"
export type { FaciesModelingPanelProps }
export type { FaciesSettings, Lithotype, FaciesTemplate } from "./data"
