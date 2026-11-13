// Synced from shadcn/ui (apps/v4/examples/base/textarea-button.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/button"
import { Textarea } from "@tecton/react/textarea"

export function TextareaButton() {
  return (
    <div className="grid w-full gap-2">
      <Textarea placeholder="Type your message here." />
      <Button>Send message</Button>
    </div>
  )
}
