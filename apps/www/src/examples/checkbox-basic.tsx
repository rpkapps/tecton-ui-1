// Synced from shadcn/ui (apps/v4/examples/base/checkbox-basic.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Checkbox } from "@tecton/react/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"

export function CheckboxBasic() {
  return (
    <FieldGroup className="mx-auto w-56">
      <Field orientation="horizontal">
        <Checkbox id="terms-checkbox-basic" name="terms-checkbox-basic" />
        <FieldLabel htmlFor="terms-checkbox-basic">
          Accept terms and conditions
        </FieldLabel>
      </Field>
    </FieldGroup>
  )
}
