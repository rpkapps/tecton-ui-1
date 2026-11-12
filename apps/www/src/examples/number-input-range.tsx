import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/field"
import { NumberInput } from "@tecton/react/number-input"

export default function NumberInputRange() {
  return (
    <FieldGroup className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="number-input-range-mud">
          Mud weight (sg)
        </FieldLabel>
        <NumberInput
          id="number-input-range-mud"
          defaultValue={1.25}
          min={0.8}
          max={2.4}
          step={0.01}
          largeStep={0.1}
          format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        />
        <FieldDescription>
          0.80 to 2.40, by 0.01; Shift steps by 0.1.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="number-input-range-choke">
          Choke (1/64 in)
        </FieldLabel>
        <NumberInput
          id="number-input-range-choke"
          defaultValue={32}
          min={8}
          max={128}
          step={2}
          largeStep={16}
        />
        <FieldDescription>Home and End go to 8 and 128.</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
