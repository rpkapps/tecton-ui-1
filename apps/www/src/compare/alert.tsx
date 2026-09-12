import * as React from "react"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
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

import { Matrix, Page } from "./matrix"

/**
 * Mirrors 008_components-alert__variant-matrix.png: severities
 * error · warning · info · success as rows, filled / outlined (plus the
 * shadcn default appearance) as columns, each with "{Title}",
 * "{Description}", a "Label" action and a dismiss button.
 */
const variants = [
  { label: "error", variant: "destructive", Icon: CircleAlertIcon },
  { label: "warning", variant: "warning", Icon: TriangleAlertIcon },
  { label: "info", variant: "info", Icon: InfoIcon },
  { label: "success", variant: "success", Icon: CircleCheckIcon },
] as const

const appearances = [
  { label: "Filled", appearance: "filled" },
  { label: "Outlined", appearance: "outline" },
  { label: "Default", appearance: "default" },
] as const

export default function AlertMatrix() {
  return (
    <Page>
      <Matrix
        columns={appearances.map(({ label }) => label)}
        rows={variants.map(({ label, variant, Icon }) => ({
          label,
          cells: appearances.map(({ appearance }) => (
            <Alert key={appearance} variant={variant} appearance={appearance}>
              <Icon />
              <AlertTitle>{"{Title}"}</AlertTitle>
              <AlertDescription>{"{Description}"}</AlertDescription>
              <AlertAction>
                <Button variant="ghost" size="xs">
                  Label
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Dismiss">
                  <XIcon />
                </Button>
              </AlertAction>
            </Alert>
          )),
        }))}
        cellClassName="w-80"
      />
    </Page>
  )
}
