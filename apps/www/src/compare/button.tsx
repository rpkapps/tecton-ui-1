import * as React from "react"

import { Button } from "@tecton/react/components/button"

import { Caption, Matrix, Page } from "./matrix"

/**
 * Mirrors 037_components-button__variant-matrix.png.
 * Storybook columns: Enabled · Hover · Pressed · Focus · Disabled · Activated.
 * Hover / Pressed / Focus are forced visual states there and cannot be forced
 * through props, so only Enabled, Disabled and Activated are rendered.
 */
const variants = [
  { label: "primary", variant: "default" },
  { label: "secondary", variant: "secondary" },
  { label: "tertiary", variant: "ghost" },
  { label: "outlined", variant: "outline" },
  { label: "textOnly", variant: "link" },
] as const

const sizes = [
  { label: "md", size: "default" },
  { label: "sm", size: "sm" },
] as const

const columns = ["Enabled", "Disabled", "Activated"]

export default function ButtonMatrix() {
  const rows = variants.flatMap(({ label, variant }) =>
    sizes.map(({ label: sizeLabel, size }) => ({
      label: `${label} (${sizeLabel})`,
      cells: [
        <Button key="enabled" variant={variant} size={size}>
          Label
        </Button>,
        <Button key="disabled" variant={variant} size={size} disabled>
          Label
        </Button>,
        <Button key="activated" variant={variant} size={size} aria-pressed>
          Label
        </Button>,
      ],
    }))
  )

  return (
    <Page>
      <Matrix columns={columns} rows={rows} />
      <Caption>
        Hover, Pressed and Focus are forced visual QA states in Storybook and
        are not rendered here.
      </Caption>
    </Page>
  )
}
