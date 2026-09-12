// Synced from shadcn/ui (apps/v4/examples/aria/field-switch.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

export default function FieldSwitch() {
  return (
    <Field orientation="horizontal" className="w-fit">
      <FieldLabel htmlFor="2fa">Multi-factor authentication</FieldLabel>
      <Switch id="2fa" />
    </Field>
  )
}
