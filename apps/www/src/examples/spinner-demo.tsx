// Synced from shadcn/ui (apps/v4/examples/base/spinner-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@tecton/react/components/item"
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
      <Item variant="muted">
        <ItemMedia>
          <Spinner />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">Processing payment...</ItemTitle>
        </ItemContent>
        <ItemContent className="flex-none justify-end">
          <span className="text-sm tabular-nums">$100.00</span>
        </ItemContent>
      </Item>
    </div>
  )
}
