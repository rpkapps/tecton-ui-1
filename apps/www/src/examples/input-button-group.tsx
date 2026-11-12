// Synced from shadcn/ui (apps/v4/examples/base/input-button-group.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/button"
import { ButtonGroup } from "@tecton/react/button-group"
import { Field, FieldLabel } from "@tecton/react/field"
import { Input } from "@tecton/react/input"

export function InputButtonGroup() {
  return (
    <Field>
      <FieldLabel htmlFor="input-button-group">Search</FieldLabel>
      <ButtonGroup>
        <Input id="input-button-group" placeholder="Type to search..." />
        <Button variant="outline">Search</Button>
      </ButtonGroup>
    </Field>
  )
}
