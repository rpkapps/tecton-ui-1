import { TextField } from "@tecton/react/tecton/text-field"

export default function TextFieldVariants() {
  return (
    <div className="grid w-full max-w-2xl gap-6 md:grid-cols-3">
      <TextField
        variant="outlined"
        label="Outlined"
        placeholder="Top Balder"
        description="shadcn default"
      />
      <TextField
        variant="filled"
        label="Filled"
        placeholder="Top Balder"
        description="Muted surface, bottom border"
      />
      <TextField
        variant="textOnly"
        label="Text only"
        placeholder="Top Balder"
        description="Underline only"
      />
    </div>
  )
}
