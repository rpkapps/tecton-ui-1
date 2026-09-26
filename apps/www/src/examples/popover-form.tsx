// Synced from shadcn/ui (apps/v4/examples/aria/popover-form.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/components/button"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"

export function PopoverForm() {
  return (
    <>
      <PopoverTrigger>
        <Button variant="outline">Open Popover</Button>
        <Popover className="w-64" placement="bottom start">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
          <FieldGroup className="gap-4">
            <Field orientation="horizontal">
              <FieldLabel htmlFor="width-form" className="w-1/2">
                Width
              </FieldLabel>
              <Input id="width-form" defaultValue="100%" />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="height-form" className="w-1/2">
                Height
              </FieldLabel>
              <Input id="height-form" defaultValue="25px" />
            </Field>
          </FieldGroup>
        </Popover>
      </PopoverTrigger>
    </>
  )
}
