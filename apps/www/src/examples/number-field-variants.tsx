import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@tecton/react/number-field"

const variants = ["outline", "filled", "text"] as const

export default function NumberFieldVariants() {
  return (
    <div className="flex max-w-40 flex-col gap-4">
      {variants.map((variant) => (
        <NumberField key={variant} defaultValue={10}>
          <NumberFieldGroup variant={variant}>
            <NumberFieldDecrement />
            <NumberFieldInput aria-label={`Value (${variant})`} />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      ))}
    </div>
  )
}
