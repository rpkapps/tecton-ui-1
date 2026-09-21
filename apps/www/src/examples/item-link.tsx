// Synced from shadcn/ui (apps/v4/examples/aria/item-link.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { ChevronRightIcon, OpenInNewIcon } from "@tecton/react/icons"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@tecton/react/components/item"

export function ItemLink() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Item href="#">
        <ItemContent>
          <ItemTitle>Visit our documentation</ItemTitle>
          <ItemDescription>
            Learn how to get started with our components.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <ChevronRightIcon className="size-4" />
        </ItemActions>
      </Item>
      <Item
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
      >
        <ItemContent>
          <ItemTitle>External resource</ItemTitle>
          <ItemDescription>
            Opens in a new tab with security attributes.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <OpenInNewIcon className="size-4" />
        </ItemActions>
      </Item>
    </div>
  )
}
