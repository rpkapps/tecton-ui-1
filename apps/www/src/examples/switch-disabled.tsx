// Synced from shadcn/ui (apps/v4/examples/base/switch-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

export function SwitchDisabled() {
  return (
    <Field orientation="horizontal" data-disabled className="w-fit">
      <Switch id="switch-disabled-unchecked" disabled />
      <FieldLabel htmlFor="switch-disabled-unchecked">Disabled</FieldLabel>
    </Field>
  )
}
