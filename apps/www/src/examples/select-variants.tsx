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

const datums = [
  { value: "msl", label: "Mean sea level" },
  { value: "kb", label: "Kelly bushing" },
  { value: "gl", label: "Ground level" },
]

export default function SelectVariants() {
  return (
    <FieldGroup className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map(({ variant, label }) => (
        <Field key={variant}>
          <FieldLabel htmlFor={`select-variants-${variant}`}>
            {label}
          </FieldLabel>
          <Select items={datums} defaultValue="msl">
            <SelectTrigger
              id={`select-variants-${variant}`}
              variant={variant}
              className="w-full"
            >
              <SelectValue placeholder="Datum" />
            </SelectTrigger>
            <SelectContent>
              {datums.map((datum) => (
                <SelectItem key={datum.value} value={datum.value}>
                  {datum.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>variant="{variant}"</FieldDescription>
        </Field>
      ))}
    </FieldGroup>
  )
}
