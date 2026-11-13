// Synced from shadcn/ui (apps/v4/examples/base/input-badge.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Badge } from "@tecton/react/badge"
import { Field, FieldLabel } from "@tecton/react/field"
import { Input } from "@tecton/react/input"

export function InputBadge() {
  return (
    <Field>
      <FieldLabel htmlFor="input-badge">
        Webhook URL{" "}
        <Badge variant="secondary" className="ml-auto">
          Beta
        </Badge>
      </FieldLabel>
      <Input
        id="input-badge"
        type="url"
        placeholder="https://api.example.com/webhook"
      />
    </Field>
  )
}
