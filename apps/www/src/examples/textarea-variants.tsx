import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Textarea } from "@tecton/react/components/textarea"

const variants = [
  { variant: "outline", label: "Outline" },
  { variant: "filled", label: "Filled" },
  { variant: "text", label: "Text" },
] as const

export default function TextareaVariants() {
  return (
    <FieldGroup className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel htmlFor={`textarea-variants-${variant}`}>
            {label}
          </FieldLabel>
          <Textarea
            id={`textarea-variants-${variant}`}
            variant={variant}
            placeholder="Notes on the interpretation"
            rows={3}
          />
          <FieldDescription>variant="{variant}"</FieldDescription>
        </Field>
      ))}
    </FieldGroup>
  )
}
