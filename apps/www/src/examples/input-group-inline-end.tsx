// Synced from shadcn/ui (apps/v4/examples/aria/input-group-inline-end.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { VisibilityOffIcon } from "@tecton/react/icons"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/components/input-group"

export function InputGroupInlineEnd() {
  return (
    <Field className="max-w-sm">
      <FieldLabel htmlFor="inline-end-input">Input</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="inline-end-input"
          type="password"
          placeholder="Enter password"
        />
        <InputGroupAddon align="inline-end">
          <VisibilityOffIcon />
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>Icon positioned at the end.</FieldDescription>
    </Field>
  )
}
