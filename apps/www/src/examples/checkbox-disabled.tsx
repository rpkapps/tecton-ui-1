// Synced from shadcn/ui (apps/v4/examples/base/checkbox-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Checkbox } from "@tecton/react/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"

export function CheckboxDisabled() {
  return (
    <FieldGroup className="mx-auto w-56">
      <Field orientation="horizontal" data-disabled>
        <Checkbox
          id="toggle-checkbox-disabled"
          name="toggle-checkbox-disabled"
          disabled
        />
        <FieldLabel htmlFor="toggle-checkbox-disabled">
          Enable notifications
        </FieldLabel>
      </Field>
    </FieldGroup>
  )
}
