// Synced from shadcn/ui (apps/v4/examples/aria/checkbox-invalid.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Checkbox } from "@tecton/react/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"

export function CheckboxInvalid() {
  return (
    <FieldGroup className="mx-auto w-56">
      <Field orientation="horizontal" data-invalid>
        <Checkbox
          id="terms-checkbox-invalid"
          name="terms-checkbox-invalid"
          isInvalid
        />
        <FieldLabel htmlFor="terms-checkbox-invalid">
          Accept terms and conditions
        </FieldLabel>
      </Field>
    </FieldGroup>
  )
}
