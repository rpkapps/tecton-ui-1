import * as React from "react"
import { SearchIcon } from "lucide-react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

import { Caption, Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 086_components-select__variant-matrix.png.
 * Blocks Outlined · Filled · TextOnly; Storybook columns are Enabled ·
 * Hovered · Focused · Pressed · Active · Disabled · Error — only the
 * prop-driven states (Enabled, Disabled, Error) are rendered, each with
 * "Option 1" pre-selected and a leading search icon like the story.
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

const options = ["Option 1", "Option 2", "Option 3"]

function SelectCell({
  variant,
  state,
}: {
  variant: (typeof variants)[number]["variant"]
  state: State
}) {
  const id = `select-${variant}-${state}`
  const isDisabled = state === "disabled"
  const isInvalid = state === "error"
  return (
    <Field data-disabled={isDisabled} data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>Field label</FieldLabel>
      <Select
        defaultSelectedKey="1"
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        className="w-full"
      >
        <SelectTrigger id={id} variant={variant}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={index} id={String(index + 1)} textValue={option}>
              <SearchIcon className="text-muted-foreground" />
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid ? (
        <FieldError>Validation failed</FieldError>
      ) : (
        <FieldDescription>Helper text</FieldDescription>
      )}
    </Field>
  )
}

export default function SelectMatrix() {
  return (
    <Page>
      {variants.map(({ label, variant }) => (
        <Section key={variant} title={label}>
          <Matrix
            columns={states.map(({ label }) => label)}
            rows={[
              {
                label: "md",
                cells: states.map(({ state }) => (
                  <SelectCell key={state} variant={variant} state={state} />
                )),
              },
            ]}
            cellClassName="w-56"
          />
        </Section>
      ))}
      <Caption>
        Hovered, Focused, Pressed and Active columns from Storybook are omitted.
      </Caption>
    </Page>
  )
}
