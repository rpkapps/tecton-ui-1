// Synced from shadcn/ui (apps/v4/examples/aria/context-menu-destructive.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { ArchiveIcon, DeleteIcon, EditSquareIcon, ShareIcon } from "@tecton/react/icons"
import { Pressable } from "react-aria-components"

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
            <EditSquareIcon />
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
            <DeleteIcon />
            Delete
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
