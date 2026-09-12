import {
  TextField,
  TextFieldDescription,
  TextFieldInput,
  TextFieldLabel,
} from "@tecton/react/tecton/text-field"

export default function TextFieldComposed() {
  return (
    <TextField className="max-w-xs" variant="filled" name="td" type="number">
      <TextFieldLabel>Total depth</TextFieldLabel>
      <div className="flex items-center gap-2">
        <TextFieldInput placeholder="3250" />
        <span className="text-sm text-muted-foreground">m MD</span>
      </div>
      <TextFieldDescription>Measured depth along the well path.</TextFieldDescription>
    </TextField>
  )
}
