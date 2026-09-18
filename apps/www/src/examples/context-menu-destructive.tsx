// Synced from shadcn/ui (apps/v4/examples/aria/context-menu-destructive.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { ArchiveIcon, PencilIcon, ShareIcon, TrashIcon } from "lucide-react"
import { Pressable } from "@tecton/react/primitives"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuDestructive() {
  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup>
          <ContextMenuItem>
            <PencilIcon />
            Edit
          </ContextMenuItem>
          <ContextMenuItem>
            <ShareIcon />
            Share
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive">
            <TrashIcon />
            Delete
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
