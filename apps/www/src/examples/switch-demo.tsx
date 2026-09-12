// Synced from shadcn/ui (apps/v4/examples/aria/switch-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Label } from "@tecton/react/components/label"
import { Switch } from "@tecton/react/components/switch"

export function SwitchDemo() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  )
}
