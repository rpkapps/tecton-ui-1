import { TextField } from "@tecton/react/tecton/text-field"

export default function TextFieldSizes() {
  return (
    <div className="grid w-full max-w-md gap-6 md:grid-cols-2">
      <TextField size="md" label="Medium" placeholder="Kick-off depth (m)" />
      <TextField size="sm" label="Small" placeholder="Kick-off depth (m)" />
    </div>
  )
}
