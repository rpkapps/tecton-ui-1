// Synced from shadcn/ui (apps/v4/examples/aria/label-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Checkbox } from "@tecton/react/components/checkbox"
import { Label } from "@tecton/react/components/label"

export default function LabelDemo() {
  return (
    <div className="flex gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  )
}
