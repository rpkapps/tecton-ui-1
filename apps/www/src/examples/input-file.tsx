// Synced from shadcn/ui (apps/v4/examples/base/input-file.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/field"
import { Input } from "@tecton/react/input"

export function InputFile() {
  return (
    <Field>
      <FieldLabel htmlFor="picture">Picture</FieldLabel>
      <Input id="picture" type="file" />
      <FieldDescription>Select a picture to upload.</FieldDescription>
    </Field>
  )
}
