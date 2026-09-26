import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

const variants = [
  { variant: "outline", label: "Outline" },
  { variant: "filled", label: "Filled" },
  { variant: "text", label: "Text" },
] as const

export default function SelectVariants() {
  return (
    <FieldGroup className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel
            id={`select-variants-${variant}-label`}
            htmlFor={`select-variants-${variant}`}
          >
            {label}
          </FieldLabel>
          <Select
            aria-labelledby={`select-variants-${variant}-label`}
            placeholder="Datum"
            defaultValue="msl"
            className="w-full"
          >
            <SelectTrigger id={`select-variants-${variant}`} variant={variant}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem id="msl">Mean sea level</SelectItem>
              <SelectItem id="kb">Kelly bushing</SelectItem>
              <SelectItem id="gl">Ground level</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>variant="{variant}"</FieldDescription>
        </Field>
      ))}
    </FieldGroup>
  )
}
