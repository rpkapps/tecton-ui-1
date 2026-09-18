// Synced from shadcn/ui (apps/v4/examples/aria/context-menu-checkboxes.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { useState } from "react"
import { Pressable, type Selection } from "@tecton/react/primitives"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuCheckboxes() {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(
    new Set(["bookmarks-bar", "developer-tools"])
  )

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
        <ContextMenuGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        >
          <ContextMenuItem id="bookmarks-bar">
            Show Bookmarks Bar
          </ContextMenuItem>
          <ContextMenuItem>Show Full URLs</ContextMenuItem>
          <ContextMenuItem id="developer-tools">
            Show Developer Tools
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
