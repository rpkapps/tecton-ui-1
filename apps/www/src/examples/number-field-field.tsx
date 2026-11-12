import { Field, FieldDescription, FieldLabel } from "@tecton/react/field"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldUnit,
} from "@tecton/react/number-field"

export default function NumberFieldInField() {
  return (
    <Field className="max-w-56">
      <FieldLabel htmlFor="choke-size">Choke size</FieldLabel>
      <NumberField id="choke-size" defaultValue={32} min={8} max={128} step={2}>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldUnit>/64 in</NumberFieldUnit>
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      <FieldDescription>Even sizes from 8 to 128.</FieldDescription>
    </Field>
  )
}
