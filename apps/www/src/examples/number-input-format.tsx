import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/field"
import { NumberInput } from "@tecton/react/number-input"

export default function NumberInputFormat() {
  return (
    <FieldGroup className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="number-input-format-td">Planned TD</FieldLabel>
        <NumberInput
          id="number-input-format-td"
          defaultValue={3250}
          min={0}
          step={10}
          largeStep={100}
          format={{ style: "unit", unit: "meter", maximumFractionDigits: 1 }}
        />
        <FieldDescription>
          Metres TVD, by 10; Shift steps by 100.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="number-input-format-porosity">Porosity</FieldLabel>
        <NumberInput
          id="number-input-format-porosity"
          defaultValue={0.215}
          min={0}
          max={1}
          step={0.005}
          largeStep={0.05}
          format={{ style: "percent", maximumFractionDigits: 1 }}
        />
        <FieldDescription>
          Held as a fraction, shown as a percentage.
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}
