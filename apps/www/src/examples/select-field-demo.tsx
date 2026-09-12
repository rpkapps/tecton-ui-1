import {
  SelectField,
  SelectFieldItem,
} from "@tecton/react/tecton/select-field"

export default function SelectFieldDemo() {
  return (
    <SelectField
      className="max-w-xs"
      label="Facies"
      placeholder="Select a facies"
      description="Dominant lithology for the interval."
    >
      <SelectFieldItem id="sandstone">Sandstone</SelectFieldItem>
      <SelectFieldItem id="shale">Shale</SelectFieldItem>
      <SelectFieldItem id="limestone">Limestone</SelectFieldItem>
      <SelectFieldItem id="coal">Coal</SelectFieldItem>
    </SelectField>
  )
}
