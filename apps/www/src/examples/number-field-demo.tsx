import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@tecton/react/number-field"

export default function NumberFieldDemo() {
  return (
    <NumberField className="max-w-40" defaultValue={12} min={0} max={100}>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Cell size" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}
