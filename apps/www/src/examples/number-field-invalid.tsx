"use client"

import * as React from "react"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@tecton/react/field"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldUnit,
} from "@tecton/react/number-field"

const FRACTURE_GRADIENT = 16.2

export default function NumberFieldInvalid() {
  const [value, setValue] = React.useState<number | null>(17.5)
  const invalid = value !== null && value > FRACTURE_GRADIENT

  return (
    <Field data-invalid={invalid || undefined} className="max-w-56">
      <FieldLabel htmlFor="mud-weight">Mud weight</FieldLabel>
      <NumberField
        id="mud-weight"
        value={value}
        onValueChange={setValue}
        min={8}
        max={20}
        step={0.1}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-invalid={invalid || undefined} />
          <NumberFieldUnit>ppg</NumberFieldUnit>
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      {invalid ? (
        <FieldError>Over the {FRACTURE_GRADIENT} ppg limit.</FieldError>
      ) : (
        <FieldDescription>
          Fracture gradient: {FRACTURE_GRADIENT} ppg.
        </FieldDescription>
      )}
    </Field>
  )
}
