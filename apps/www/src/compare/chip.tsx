import * as React from "react"

import { Chip, ChipRemove } from "@tecton/react/tecton/chip"

import { Cell, ColumnHeader, Page, Section } from "./matrix"

/**
 * Mirrors 042_components-chip__variant-matrix.png.
 * One block per colour (Default · Primary · Error · Warning · Info · Success);
 * inside, two columns (Filled / Outlined) with rows Chip · Clickable ·
 * Disabled · Deletable, each rendered at md / sm / xs.
 */
const colors = [
  { label: "Default", color: "default" },
  { label: "Primary", color: "primary" },
  { label: "Error", color: "error" },
  { label: "Warning", color: "warning" },
  { label: "Info", color: "info" },
  { label: "Success", color: "success" },
] as const

const variants = [
  { label: "Filled", variant: "filled" },
  { label: "Outlined", variant: "outlined" },
] as const

const sizes = ["md", "sm", "xs"] as const

const noop = () => {}

function ChipRow({
  color,
  variant,
  kind,
}: {
  color: (typeof colors)[number]["color"]
  variant: (typeof variants)[number]["variant"]
  kind: "plain" | "clickable" | "disabled" | "deletable"
}) {
  return (
    <Cell>
      {sizes.map((size) => {
        const shared = { color, variant, size } as const
        switch (kind) {
          case "plain":
            return (
              <Chip key={size} {...shared}>
                Chip
              </Chip>
            )
          case "clickable":
            return (
              <Chip key={size} {...shared} onPress={noop}>
                Clickable
              </Chip>
            )
          case "disabled":
            return (
              <Chip key={size} {...shared} isDisabled>
                Disabled
              </Chip>
            )
          case "deletable":
            return (
              <Chip key={size} {...shared}>
                Deletable
                <ChipRemove />
              </Chip>
            )
        }
      })}
    </Cell>
  )
}

export default function ChipMatrix() {
  return (
    <Page>
      {colors.map(({ label, color }) => (
        <Section key={color} title={label}>
          <div className="grid w-fit grid-cols-2 gap-x-10 gap-y-4">
            {variants.map(({ label: variantLabel }) => (
              <ColumnHeader key={variantLabel}>{variantLabel}</ColumnHeader>
            ))}
            {(["plain", "clickable", "disabled", "deletable"] as const).map(
              (kind) => (
                <React.Fragment key={kind}>
                  {variants.map(({ variant }) => (
                    <ChipRow
                      key={variant}
                      color={color}
                      variant={variant}
                      kind={kind}
                    />
                  ))}
                </React.Fragment>
              )
            )}
          </div>
        </Section>
      ))}
    </Page>
  )
}
