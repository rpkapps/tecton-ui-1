import { Separator } from "@tecton/react/components/separator"

export default function SeparatorLabel() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 text-sm">
      <p>Alternative A — 3 wells, 2 templates</p>
      <div
        role="separator"
        className="flex items-center gap-3 text-xs text-muted-foreground"
      >
        <Separator emphasis="subtle" className="flex-1" />
        or
        <Separator emphasis="subtle" className="flex-1" />
      </div>
      <p>Alternative B — 4 wells, 1 template</p>
      <div
        role="separator"
        className="flex items-center gap-3 text-xs text-muted-foreground"
      >
        <Separator emphasis="strong" className="flex-1" />
        Archived alternatives
        <Separator emphasis="strong" className="flex-1" />
      </div>
    </div>
  )
}
