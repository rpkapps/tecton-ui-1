import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import { Textarea } from "@tecton/react/components/textarea"

import { Caption, Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 105_components-textfield__variant-matrix.png.
 * Blocks Outlined · Filled · TextOnly; Storybook columns are Enabled ·
 * Hovered · Focused · Pressed · Disabled · Error — only the prop-driven
 * states (Enabled, Disabled, Error) are rendered, as Input and Textarea
 * inside a Field.
 */
const variants = [
  { label: "Outlined", variant: "outline" },
  { label: "Filled", variant: "filled" },
  { label: "TextOnly", variant: "text" },
] as const

type State = "enabled" | "disabled" | "error"

const states: { label: string; state: State }[] = [
  { label: "Enabled", state: "enabled" },
  { label: "Disabled", state: "disabled" },
  { label: "Error", state: "error" },
]

function InputCell({
  variant,
  state,
  multiline,
}: {
  variant: (typeof variants)[number]["variant"]
  state: State
  multiline?: boolean
}) {
  const id = `input-${variant}-${state}${multiline ? "-multiline" : ""}`
  const isDisabled = state === "disabled"
  const isInvalid = state === "error"
  const control = multiline ? (
    <Textarea
      id={id}
      variant={variant}
      placeholder="Type here"
      rows={2}
      disabled={isDisabled}
      aria-invalid={isInvalid}
    />
  ) : (
    <Input
      id={id}
      variant={variant}
      placeholder="Type here"
      disabled={isDisabled}
      aria-invalid={isInvalid}
    />
  )
  return (
    <Field data-disabled={isDisabled} data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>Field label</FieldLabel>
      {control}
      {isInvalid ? (
        <FieldError>Validation failed</FieldError>
      ) : (
        <FieldDescription>Helper text</FieldDescription>
      )}
    </Field>
  )
}

export default function InputMatrix() {
  return (
    <Page>
      {variants.map(({ label, variant }) => (
        <Section key={variant} title={label}>
          <Matrix
            columns={states.map(({ label }) => label)}
            rows={[
              {
                label: "Input",
                cells: states.map(({ state }) => (
                  <InputCell key={state} variant={variant} state={state} />
                )),
              },
              {
                label: "Textarea",
                cells: states.map(({ state }) => (
                  <InputCell
                    key={state}
                    variant={variant}
                    state={state}
                    multiline
                  />
                )),
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
