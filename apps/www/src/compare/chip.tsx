import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

import { Caption, Cell, ColumnHeader, Page, Section } from "./matrix"

/**
 * Mirrors 042_components-chip__variant-matrix.png.
 * One block per colour (Default · Primary · Error · Warning · Info · Success);
 * inside, two columns (Filled / Outlined) with rows Badge · Disabled chip ·
 * Removable chip, each rendered at lg / md / default. The static rows are
 * shadcn Badges, the interactive rows are Tecton Chips in a ChipGroup.
 */
const colors = [
  { label: "Default", variant: "secondary" },
  { label: "Primary", variant: "default" },
  { label: "Error", variant: "destructive" },
  { label: "Warning", variant: "warning" },
  { label: "Info", variant: "info" },
  { label: "Success", variant: "success" },
] as const

const appearances = [
  { label: "Filled", appearance: "solid" },
  { label: "Outlined", appearance: "outline" },
] as const

const sizes = ["lg", "md", "default"] as const

const noop = () => {}

type Variant = (typeof colors)[number]["variant"]
type Appearance = (typeof appearances)[number]["appearance"]

function BadgeRow({
  variant,
  appearance,
}: {
  variant: Variant
  appearance: Appearance
}) {
  return (
    <Cell>
      {sizes.map((size) => (
        <Badge key={size} variant={variant} appearance={appearance} size={size}>
          Badge
        </Badge>
      ))}
    </Cell>
  )
}

function ChipRow({
  variant,
  appearance,
  kind,
}: {
  variant: Variant
  appearance: Appearance
  kind: "selectable" | "disabled" | "removable"
}) {
  return (
    <Cell>
      <ChipGroup
        aria-label={`${variant} ${appearance} ${kind}`}
        selectionMode={kind === "removable" ? "none" : "multiple"}
        defaultSelectedKeys={kind === "selectable" ? ["md"] : undefined}
        disabledKeys={kind === "disabled" ? sizes : undefined}
        onRemove={kind === "removable" ? noop : undefined}
      >
        <ChipList className="items-center gap-3">
          {sizes.map((size) => (
            <Chip
              key={size}
              id={size}
              variant={variant}
              appearance={appearance}
              size={size}
            >
              {kind === "selectable"
                ? "Selectable"
                : kind === "disabled"
                  ? "Disabled"
                  : "Removable"}
            </Chip>
          ))}
        </ChipList>
      </ChipGroup>
    </Cell>
  )
}

export default function ChipMatrix() {
  return (
    <Page>
      {colors.map(({ label, variant }) => (
        <Section key={variant} title={label}>
          <div className="grid w-fit grid-cols-2 gap-x-10 gap-y-4">
            {appearances.map(({ label: appearanceLabel }) => (
              <ColumnHeader key={appearanceLabel}>
                {appearanceLabel}
              </ColumnHeader>
            ))}
            {appearances.map(({ appearance }) => (
              <BadgeRow
                key={appearance}
                variant={variant}
                appearance={appearance}
              />
            ))}
            {(["selectable", "disabled", "removable"] as const).map((kind) => (
              <React.Fragment key={kind}>
                {appearances.map(({ appearance }) => (
                  <ChipRow
                    key={appearance}
                    variant={variant}
                    appearance={appearance}
                    kind={kind}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </Section>
      ))}
      <Caption>
        The first row of each block is the static Badge; the others are Chips in
        a ChipGroup (the "Selectable" row has the middle chip selected).
      </Caption>
    </Page>
  )
}
