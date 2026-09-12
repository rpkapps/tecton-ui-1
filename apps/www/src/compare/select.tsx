import * as React from "react"
import { SearchIcon } from "lucide-react"

import { SelectField, SelectFieldItem } from "@tecton/react/tecton/select-field"

import { Caption, Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 086_components-select__variant-matrix.png.
 * Blocks Outlined · Filled · TextOnly; Storybook columns are Enabled ·
 * Hovered · Focused · Pressed · Active · Disabled · Error — only the
 * prop-driven states (Enabled, Disabled, Error) are rendered, each with
 * "Option 1" pre-selected and a leading search icon like the story.
 */
const variants = [
  { label: "Outlined", variant: "outlined" },
  { label: "Filled", variant: "filled" },
  { label: "TextOnly", variant: "textOnly" },
] as const

const options = ["Option 1", "Option 2", "Option 3"]

function Options() {
  return (
    <>
      {options.map((option, index) => (
        <SelectFieldItem key={index} id={String(index + 1)} textValue={option}>
          <SearchIcon className="text-muted-foreground" />
          {option}
        </SelectFieldItem>
      ))}
    </>
  )
}

export default function SelectMatrix() {
  return (
    <Page>
      {variants.map(({ label, variant }) => (
        <Section key={variant} title={label}>
          <Matrix
            columns={["Enabled", "Disabled", "Error"]}
            rows={[
              {
                label: "md",
                cells: [
                  <SelectField
                    key="enabled"
                    aria-label="Field label"
                    variant={variant}
                    label="Field label"
                    description="Helper text"
                    defaultSelectedKey="1"
                  >
                    <Options />
                  </SelectField>,
                  <SelectField
                    key="disabled"
                    aria-label="Field label"
                    variant={variant}
                    label="Field label"
                    description="Helper text"
                    defaultSelectedKey="1"
                    isDisabled
                  >
                    <Options />
                  </SelectField>,
                  <SelectField
                    key="error"
                    aria-label="Field label"
                    variant={variant}
                    label="Field label"
                    errorMessage="Validation failed"
                    defaultSelectedKey="1"
                  >
                    <Options />
                  </SelectField>,
                ],
              },
            ]}
            cellClassName="w-56"
          />
        </Section>
      ))}
      <Caption>
        Hovered, Focused, Pressed and Active columns from Storybook are
        omitted.
      </Caption>
    </Page>
  )
}
