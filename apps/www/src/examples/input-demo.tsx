// Synced from shadcn/ui (apps/v4/examples/base/input-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputDemo() {
  return (
    <Field>
      <FieldLabel htmlFor="input-demo-api-key">API Key</FieldLabel>
      <Input id="input-demo-api-key" type="password" placeholder="sk-..." />
      <FieldDescription>
        Your API key is encrypted and stored securely.
      </FieldDescription>
    </Field>
  )
}
