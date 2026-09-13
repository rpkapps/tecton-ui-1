"use client"

import { BellIcon, PinIcon, StarIcon, UserPlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  OverflowItem,
  OverflowLabel,
  Toolbar,
} from "@tecton/react/tecton/overflow"

export default function OverflowPriority() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="min-w-40 resize-x overflow-hidden rounded-md border p-2">
        {/* labels="always": items keep their text and go straight to the menu. */}
        <Toolbar aria-label="Well toolbar" labels="always">
          <OverflowItem
            id="assign"
            label="Assign"
            icon={<UserPlusIcon />}
            priority={3}
          >
            <Button variant="outline">
              <UserPlusIcon data-icon="inline-start" />
              <OverflowLabel>Assign</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            id="watch"
            label="Watch"
            icon={<BellIcon />}
            priority={2}
          >
            <Button variant="outline">
              <BellIcon data-icon="inline-start" />
              <OverflowLabel>Watch</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="star" label="Star" icon={<StarIcon />} priority={1}>
            <Button variant="outline">
              <StarIcon data-icon="inline-start" />
              <OverflowLabel>Star</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="pin" label="Pin" icon={<PinIcon />}>
            <Button variant="outline">
              <PinIcon data-icon="inline-start" />
              <OverflowLabel>Pin</OverflowLabel>
            </Button>
          </OverflowItem>
        </Toolbar>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the corner: Pin leaves first, Assign last.
      </p>
    </div>
  )
}
