// Synced from shadcn/ui (apps/v4/examples/aria/kbd-group.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Kbd, KbdGroup } from "@tecton/react/components/kbd"

export default function KbdGroupExample() {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Use{" "}
        <KbdGroup>
          <Kbd>Ctrl + B</Kbd>
          <Kbd>Ctrl + K</Kbd>
        </KbdGroup>{" "}
        to open the command palette
      </p>
    </div>
  )
}
