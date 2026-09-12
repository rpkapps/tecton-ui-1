import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

const variants = [
  { variant: "outline", label: "Outline" },
  { variant: "filled", label: "Filled" },
  { variant: "text", label: "Text" },
] as const

export default function InputVariants() {
  return (
    <FieldGroup className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel htmlFor={`input-variants-${variant}`}>{label}</FieldLabel>
          <Input
            id={`input-variants-${variant}`}
            variant={variant}
            placeholder="Well name"
          />
          <FieldDescription>variant="{variant}"</FieldDescription>
        </Field>
      ))}
    </FieldGroup>
  )
}
