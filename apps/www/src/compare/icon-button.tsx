import * as React from "react"
import { CubeIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"

import { Caption, Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 064_components-iconbutton__variant-matrix.png.
 * Storybook renders two blocks (medium / small) with rows
 * primary · secondary · tertiary · outlined · textOnly and unlabelled state
 * columns. Only the states reachable through props are rendered.
 */
const variants = [
  { label: "primary", variant: "default" },
  { label: "secondary", variant: "secondary" },
  { label: "tertiary", variant: "ghost" },
  { label: "outlined", variant: "outline" },
  { label: "textOnly", variant: "link" },
] as const

const sizes = [
  { label: "medium", size: "icon" },
  { label: "small", size: "icon-sm" },
] as const

const columns = ["Enabled", "Disabled", "Activated"]

export default function IconButtonMatrix() {
  return (
    <Page>
      {sizes.map(({ label, size }) => (
        <Section key={label} title={label}>
          <Matrix
            columns={columns}
            rows={variants.map(({ label: variantLabel, variant }) => ({
              label: variantLabel,
              cells: [
                <Button
                  key="enabled"
                  variant={variant}
                  size={size}
                  aria-label="Box"
                >
                  <CubeIcon />
                </Button>,
                <Button
                  key="disabled"
                  variant={variant}
                  size={size}
                  aria-label="Box"
                  isDisabled
                >
                  <CubeIcon />
                </Button>,
                <Button
                  key="activated"
                  variant={variant}
                  size={size}
                  aria-label="Box"
                  aria-pressed
                >
                  <CubeIcon />
                </Button>,
              ],
            }))}
          />
        </Section>
      ))}
      <Caption>
        Hover, Pressed and Focus columns from Storybook are omitted (not
        forceable through props).
      </Caption>
    </Page>
  )
}
