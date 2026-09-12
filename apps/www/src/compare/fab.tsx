import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Fab } from "@tecton/react/tecton/fab"

import { Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 058_components-fab__variant-matrix.png.
 * EXTENDED: columns Primary · Secondary · Tertiary · Outlined; per size
 * (medium / small) rows With icon · No icon · Activated · Disabled.
 * ROUND: same columns; per size rows Enabled · Activated · Disabled.
 */
const variants = [
  { label: "Primary", variant: "primary" },
  { label: "Secondary", variant: "secondary" },
  { label: "Tertiary", variant: "tertiary" },
  { label: "Outlined", variant: "outlined" },
] as const

const sizes = [
  { label: "size=medium", size: "md" },
  { label: "size=small", size: "sm" },
] as const

const columns = variants.map(({ label }) => label)

export default function FabMatrix() {
  return (
    <Page>
      <Section title="Extended" eyebrow>
        {sizes.map(({ label, size }) => (
          <Matrix
            key={size}
            title={label}
            columns={columns}
            rows={[
              {
                label: "With icon",
                cells: variants.map(({ variant }) => (
                  <Fab key={variant} variant={variant} size={size}>
                    <PlusIcon />
                    Fab
                  </Fab>
                )),
              },
              {
                label: "No icon",
                cells: variants.map(({ variant }) => (
                  <Fab key={variant} variant={variant} size={size}>
                    Fab
                  </Fab>
                )),
              },
              {
                label: "Activated",
                cells: variants.map(({ variant }) => (
                  <Fab key={variant} variant={variant} size={size} isActive>
                    <PlusIcon />
                    Fab
                  </Fab>
                )),
              },
              {
                label: "Disabled",
                cells: variants.map(({ variant }) => (
                  <Fab key={variant} variant={variant} size={size} isDisabled>
                    <PlusIcon />
                    Fab
                  </Fab>
                )),
              },
            ]}
          />
        ))}
      </Section>

      <Section title="Round" eyebrow>
        {sizes.map(({ label, size }) => (
          <Matrix
            key={size}
            title={label}
            columns={columns}
            rows={[
              {
                label: "Enabled",
                cells: variants.map(({ variant }) => (
                  <Fab
                    key={variant}
                    variant={variant}
                    size={size}
                    shape="round"
                    aria-label="Add"
                  >
                    <PlusIcon />
                  </Fab>
                )),
              },
              {
                label: "Activated",
                cells: variants.map(({ variant }) => (
                  <Fab
                    key={variant}
                    variant={variant}
                    size={size}
                    shape="round"
                    aria-label="Add"
                    isActive
                  >
                    <PlusIcon />
                  </Fab>
                )),
              },
              {
                label: "Disabled",
                cells: variants.map(({ variant }) => (
                  <Fab
                    key={variant}
                    variant={variant}
                    size={size}
                    shape="round"
                    aria-label="Add"
                    isDisabled
                  >
                    <PlusIcon />
                  </Fab>
                )),
              },
            ]}
          />
        ))}
      </Section>
    </Page>
  )
}
