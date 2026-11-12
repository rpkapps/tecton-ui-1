import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldScrubArea,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@tecton/react/number-field"
import { Label } from "@tecton/react/label"

export default function NumberFieldScrub() {
  return (
    <NumberField
      id="grid-spacing"
      className="max-w-40"
      defaultValue={50}
      min={0}
    >
      <NumberFieldScrubArea>
        <Label htmlFor="grid-spacing">Grid spacing</Label>
      </NumberFieldScrubArea>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}
