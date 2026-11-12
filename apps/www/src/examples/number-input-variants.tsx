import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/field"
import { NumberInput } from "@tecton/react/number-input"

const variants = [
  { variant: "outline", label: "Outline" },
  { variant: "filled", label: "Filled" },
  { variant: "text", label: "Text" },
] as const

export default function NumberInputVariants() {
  return (
    <FieldGroup className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel htmlFor={`number-input-variants-${variant}`}>
            {label}
          </FieldLabel>
          <NumberInput
            id={`number-input-variants-${variant}`}
            variant={variant}
            defaultValue={12}
          />
          <FieldDescription>variant="{variant}"</FieldDescription>
        </Field>
      ))}
      <Field data-disabled>
        <FieldLabel htmlFor="number-input-variants-disabled">
          Disabled
        </FieldLabel>
        <NumberInput
          id="number-input-variants-disabled"
          defaultValue={12}
          disabled
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="number-input-variants-read-only">
          Read-only
        </FieldLabel>
        <NumberInput
          id="number-input-variants-read-only"
          defaultValue={12}
          readOnly
        />
      </Field>
    </FieldGroup>
  )
}
