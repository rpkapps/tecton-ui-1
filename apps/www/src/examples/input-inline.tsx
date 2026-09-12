// Synced from shadcn/ui (apps/v4/examples/aria/input-inline.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/components/button"
import { Field } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function InputInline() {
  return (
    <Field orientation="horizontal">
      <Input type="search" placeholder="Search..." />
      <Button>Search</Button>
    </Field>
  )
}
