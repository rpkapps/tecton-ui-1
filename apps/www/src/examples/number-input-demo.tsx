import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { NumberInput } from "@tecton/react/tecton/number-input"

export default function NumberInputDemo() {
  return (
    <Field className="max-w-xs">
      <FieldLabel htmlFor="number-input-demo">Casing strings</FieldLabel>
      <NumberInput id="number-input-demo" defaultValue={4} min={0} />
      <FieldDescription>
        Type a number, or step it with − and +.
      </FieldDescription>
    </Field>
  )
}
