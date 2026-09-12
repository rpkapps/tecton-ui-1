import {
  SelectField,
  SelectFieldItem,
} from "@tecton/react/tecton/select-field"

const variants = ["outlined", "filled", "textOnly"] as const

export default function SelectFieldVariants() {
  return (
    <div className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      {variants.map((variant) => (
        <SelectField
          key={variant}
          variant={variant}
          label={variant === "textOnly" ? "Text only" : variant}
          placeholder="Datum"
          defaultSelectedKey="msl"
        >
          <SelectFieldItem id="msl">Mean sea level</SelectFieldItem>
          <SelectFieldItem id="kb">Kelly bushing</SelectFieldItem>
          <SelectFieldItem id="gl">Ground level</SelectFieldItem>
        </SelectField>
      ))}
    </div>
  )
}
