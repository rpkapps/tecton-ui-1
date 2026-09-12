import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

import { Caption, Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 058_components-fab__variant-matrix.png with the Button FAB
 * recipe (`rounded-full shadow-md`).
 * EXTENDED: columns Primary · Secondary · Tertiary · Outlined; per size
 * (medium / small) rows With icon · No icon · Disabled.
 * ROUND: same columns; per size rows Enabled · Disabled.
 */
const variants = [
  { label: "Primary", variant: "default" },
  { label: "Secondary", variant: "secondary" },
  { label: "Tertiary", variant: "ghost" },
  { label: "Outlined", variant: "outline" },
] as const

const sizes = [
  { label: "size=medium", extended: "h-10", icon: "icon-lg" },
  { label: "size=small", extended: "h-9", icon: "icon" },
] as const

const columns = variants.map(({ label }) => label)

export default function FabMatrix() {
  return (
    <Page>
      <Section title="Extended" eyebrow>
        {sizes.map(({ label, extended }) => (
          <Matrix
            key={label}
            title={label}
            columns={columns}
            rows={[
              {
                label: "With icon",
                cells: variants.map(({ variant }) => (
                  <Button
                    key={variant}
                    variant={variant}
                    className={`${extended} rounded-full shadow-md`}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Fab
                  </Button>
                )),
              },
              {
                label: "No icon",
                cells: variants.map(({ variant }) => (
                  <Button
                    key={variant}
                    variant={variant}
                    className={`${extended} rounded-full shadow-md`}
                  >
                    Fab
                  </Button>
                )),
              },
              {
                label: "Disabled",
                cells: variants.map(({ variant }) => (
                  <Button
                    key={variant}
                    variant={variant}
                    className={`${extended} rounded-full shadow-md`}
                    isDisabled
                  >
                    <PlusIcon data-icon="inline-start" />
                    Fab
                  </Button>
                )),
              },
            ]}
          />
        ))}
      </Section>

      <Section title="Round" eyebrow>
        {sizes.map(({ label, icon }) => (
          <Matrix
            key={label}
            title={label}
            columns={columns}
            rows={[
              {
                label: "Enabled",
                cells: variants.map(({ variant }) => (
                  <Button
                    key={variant}
                    variant={variant}
                    size={icon}
                    className="rounded-full shadow-md"
                    aria-label="Add"
                  >
                    <PlusIcon />
                  </Button>
                )),
              },
              {
                label: "Disabled",
                cells: variants.map(({ variant }) => (
                  <Button
                    key={variant}
                    variant={variant}
                    size={icon}
                    className="rounded-full shadow-md"
                    aria-label="Add"
                    isDisabled
                  >
                    <PlusIcon />
                  </Button>
                )),
              },
            ]}
          />
        ))}
      </Section>
      <Caption>
        The Activated row from Storybook is omitted: the FAB is a Button recipe
        without a persistent active state.
      </Caption>
    </Page>
  )
}
