// Synced from shadcn/ui (apps/v4/examples/aria/button-group-popover.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { ChevronDownIcon, Robot2Icon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@tecton/react/components/field"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import { Textarea } from "@tecton/react/components/textarea"

export default function ButtonGroupPopover() {
  return (
    <ButtonGroup>
      <Button variant="outline">
        <Robot2Icon /> Copilot
      </Button>
      <PopoverTrigger>
        <Button variant="outline" size="icon" aria-label="Open Popover">
          <ChevronDownIcon />
        </Button>
        <Popover placement="bottom end" className="rounded-xl text-sm">
          <PopoverHeader>
            <PopoverTitle>Start a new task with Copilot</PopoverTitle>
            <PopoverDescription>
              Describe your task in natural language.
            </PopoverDescription>
          </PopoverHeader>
          <Field>
            <FieldLabel htmlFor="task" className="sr-only">
              Task Description
            </FieldLabel>
            <Textarea
              id="task"
              placeholder="I need to..."
              className="resize-none"
            />
            <FieldDescription>
              Copilot will open a pull request for review.
            </FieldDescription>
          </Field>
        </Popover>
      </PopoverTrigger>
    </ButtonGroup>
  )
}
