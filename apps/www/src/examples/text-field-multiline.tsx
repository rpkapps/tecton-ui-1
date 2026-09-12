import { TextField } from "@tecton/react/tecton/text-field"

export default function TextFieldMultiline() {
  return (
    <TextField
      className="max-w-md"
      multiline
      rows={4}
      label="Interpretation notes"
      placeholder="Fault block A shows a clear onlap onto Top Sele…"
      description="Visible to everyone with access to the project."
    />
  )
}
