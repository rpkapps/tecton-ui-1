import * as React from "react"

import { TextField } from "@tecton/react/tecton/text-field"

import { Caption, Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 105_components-textfield__variant-matrix.png.
 * Blocks Outlined · Filled · TextOnly; Storybook columns are Enabled ·
 * Hovered · Focused · Pressed · Disabled · Error — only the prop-driven
 * states (Enabled, Disabled, Error) are rendered.
 */
const variants = [
  { label: "Outlined", variant: "outlined" },
  { label: "Filled", variant: "filled" },
  { label: "TextOnly", variant: "textOnly" },
] as const

export default function TextFieldMatrix() {
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
                  <TextField
                    key="enabled"
                    variant={variant}
                    label="Field label"
                    placeholder="Type here"
                    description="Helper text"
                  />,
                  <TextField
                    key="disabled"
                    variant={variant}
                    label="Field label"
                    placeholder="Type here"
                    description="Helper text"
                    isDisabled
                  />,
                  <TextField
                    key="error"
                    variant={variant}
                    label="Field label"
                    placeholder="Type here"
                    errorMessage="Validation failed"
                  />,
                ],
              },
            ]}
            cellClassName="w-60"
          />
        </Section>
      ))}
      <Caption>
        Hovered, Focused and Pressed columns from Storybook are omitted.
      </Caption>
    </Page>
  )
}
