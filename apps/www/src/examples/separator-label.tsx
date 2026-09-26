import { Separator } from "@tecton/react/components/separator"

/**
 * The label is ordinary text in a flex row; the two rules are decorative, so
 * they sit in `aria-hidden` wrappers and a screen reader reads only the text.
 */
export default function SeparatorLabel() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 text-sm">
      <p>Alternative A — 3 wells, 2 templates</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div aria-hidden="true" className="flex-1">
          <Separator emphasis="subtle" />
        </div>
        or
        <div aria-hidden="true" className="flex-1">
          <Separator emphasis="subtle" />
        </div>
      </div>
      <p>Alternative B — 4 wells, 1 template</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div aria-hidden="true" className="flex-1">
          <Separator emphasis="strong" />
        </div>
        Archived alternatives
        <div aria-hidden="true" className="flex-1">
          <Separator emphasis="strong" />
        </div>
      </div>
    </div>
  )
}
