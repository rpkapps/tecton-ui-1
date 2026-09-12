// Synced from shadcn/ui (apps/v4/examples/aria/textarea-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Textarea } from "@tecton/react/components/textarea"

export function TextareaDisabled() {
  return (
    <Field data-disabled>
      <FieldLabel htmlFor="textarea-disabled">Message</FieldLabel>
      <Textarea
        id="textarea-disabled"
        placeholder="Type your message here."
        disabled
      />
    </Field>
  )
}
