// Synced from shadcn/ui (apps/v4/examples/base/input-invalid.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/field"
import { Input } from "@tecton/react/input"

export function InputInvalid() {
  return (
    <Field data-invalid>
      <FieldLabel htmlFor="input-invalid">Invalid Input</FieldLabel>
      <Input id="input-invalid" placeholder="Error" aria-invalid />
      <FieldDescription>
        This field contains validation errors.
      </FieldDescription>
    </Field>
  )
}
