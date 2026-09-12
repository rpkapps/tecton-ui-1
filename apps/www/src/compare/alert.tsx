import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { StatusAlert } from "@tecton/react/tecton/status-alert"

import { Matrix, Page } from "./matrix"

/**
 * Mirrors 008_components-alert__variant-matrix.png: severities
 * error · warning · info · success as rows, filled / outlined as columns,
 * each with "{Title}", "{Description}", a "Label" action and a dismiss button.
 */
const severities = ["error", "warning", "info", "success"] as const
const variants = ["filled", "outlined"] as const

const noop = () => {}

export default function AlertMatrix() {
  return (
    <Page>
      <Matrix
        columns={["Filled", "Outlined"]}
        rows={severities.map((severity) => ({
          label: severity,
          cells: variants.map((variant) => (
            <StatusAlert
              key={variant}
              severity={severity}
              variant={variant}
              title="{Title}"
              description="{Description}"
              action={
                <Button variant="ghost" size="sm">
                  Label
                </Button>
              }
              onDismiss={noop}
            />
          )),
        }))}
        cellClassName="w-80"
      />
    </Page>
  )
}
