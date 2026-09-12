import {
  SelectField,
  SelectFieldItem,
} from "@tecton/react/tecton/select-field"

export default function SelectFieldError() {
  return (
    <div className="grid w-full max-w-md gap-6 md:grid-cols-2">
      <SelectField
        label="Well type"
        placeholder="Select"
        errorMessage="A well type is required."
      >
        <SelectFieldItem id="exploration">Exploration</SelectFieldItem>
        <SelectFieldItem id="production">Production</SelectFieldItem>
        <SelectFieldItem id="injection">Injection</SelectFieldItem>
      </SelectField>
      <SelectField
        size="sm"
        label="Small"
        placeholder="Select"
        isDisabled
        description="Disabled"
      >
        <SelectFieldItem id="a">Alternative A</SelectFieldItem>
      </SelectField>
    </div>
  )
}
