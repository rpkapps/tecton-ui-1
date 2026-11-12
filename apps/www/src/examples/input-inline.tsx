// Synced from shadcn/ui (apps/v4/examples/base/input-inline.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/button"
import { Field } from "@tecton/react/field"
import { Input } from "@tecton/react/input"

export function InputInline() {
  return (
    <Field orientation="horizontal">
      <Input type="search" placeholder="Search..." />
      <Button>Search</Button>
    </Field>
  )
}
