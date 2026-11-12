// Synced from shadcn/ui (apps/v4/examples/base/switch-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Label } from "@tecton/react/label"
import { Switch } from "@tecton/react/switch"

export function SwitchDemo() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  )
}
