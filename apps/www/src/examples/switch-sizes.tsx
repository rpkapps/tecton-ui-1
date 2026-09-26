// Synced from shadcn/ui (apps/v4/examples/base/switch-sizes.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

export function SwitchSizes() {
  return (
    <FieldGroup className="w-full max-w-[10rem]">
      <Field orientation="horizontal">
        <Switch id="switch-size-sm" size="sm" />
        <FieldLabel htmlFor="switch-size-sm">Small</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch id="switch-size-default" size="default" />
        <FieldLabel htmlFor="switch-size-default">Default</FieldLabel>
      </Field>
    </FieldGroup>
  )
}
