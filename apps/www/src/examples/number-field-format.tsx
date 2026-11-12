import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@tecton/react/number-field"

export default function NumberFieldFormat() {
  return (
    <div className="flex max-w-48 flex-col gap-4">
      <NumberField
        defaultValue={0.18}
        min={0}
        max={1}
        step={0.01}
        format={{ style: "percent" }}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Porosity" />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      <NumberField
        defaultValue={1250.5}
        step={0.5}
        format={{ style: "unit", unit: "meter", minimumFractionDigits: 1 }}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Offset" />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </div>
  )
}
