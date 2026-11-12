"use client"

import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@tecton/react/field"
import { NumberInput } from "@tecton/react/number-input"

const MAX_DEPTH = 6000

export default function NumberInputField() {
  const [depth, setDepth] = React.useState<number | null>(7200)
  const error =
    depth === null
      ? "Enter the water depth."
      : depth < 0
        ? "Water depth is 0 m or more."
        : depth > MAX_DEPTH
          ? "The rig is rated to 6,000 m of water."
          : null
  const invalid = error !== null

  return (
    <Field data-invalid={invalid || undefined} className="max-w-xs">
      <FieldLabel htmlFor="number-input-field-depth">
        Water depth (m)
      </FieldLabel>
      <NumberInput
        id="number-input-field-depth"
        value={depth}
        onValueChange={setDepth}
        min={0}
        max={MAX_DEPTH}
        allowOutOfRange
        required
        aria-invalid={invalid || undefined}
        aria-describedby={
          invalid
            ? "number-input-field-error"
            : "number-input-field-description"
        }
      />
      {invalid ? (
        <FieldError id="number-input-field-error">{error}</FieldError>
      ) : (
        <FieldDescription id="number-input-field-description">
          Metres below mean sea level.
        </FieldDescription>
      )}
    </Field>
  )
}
