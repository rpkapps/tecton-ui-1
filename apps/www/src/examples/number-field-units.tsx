import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldUnit,
} from "@tecton/react/number-field"

export default function NumberFieldUnits() {
  return (
    <div className="flex max-w-48 flex-col gap-4">
      <NumberField defaultValue={8500} min={0} step={10} largeStep={100}>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Measured depth" />
          <NumberFieldUnit>ft</NumberFieldUnit>
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      <NumberField defaultValue={3200} min={0}>
        <NumberFieldGroup>
          <NumberFieldInput aria-label="Wellhead pressure" />
          <NumberFieldUnit>psi</NumberFieldUnit>
        </NumberFieldGroup>
      </NumberField>
    </div>
  )
}
