// Synced from shadcn/ui (apps/v4/examples/aria/context-menu-sides.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { Pressable } from "@tecton/react/primitives"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuSides() {
  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-4">
      <ContextMenuTrigger>
        <Pressable>
          <div
            role="button"
            className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
          >
            <span className="hidden pointer-fine:inline-block">
              Right click (top)
            </span>
            <span className="hidden pointer-coarse:inline-block">
              Long press (top)
            </span>
          </div>
        </Pressable>
        <ContextMenu placement="top start">
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      </ContextMenuTrigger>
      <ContextMenuTrigger>
        <Pressable>
          <div
            role="button"
            className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
          >
            <span className="hidden pointer-fine:inline-block">
              Right click (right)
            </span>
            <span className="hidden pointer-coarse:inline-block">
              Long press (right)
            </span>
          </div>
        </Pressable>
        <ContextMenu placement="right top">
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      </ContextMenuTrigger>
      <ContextMenuTrigger>
        <Pressable>
          <div
            role="button"
            className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
          >
            <span className="hidden pointer-fine:inline-block">
              Right click (bottom)
            </span>
            <span className="hidden pointer-coarse:inline-block">
              Long press (bottom)
            </span>
          </div>
        </Pressable>
        <ContextMenu placement="bottom start">
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      </ContextMenuTrigger>
      <ContextMenuTrigger>
        <Pressable>
          <div
            role="button"
            className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
          >
            <span className="hidden pointer-fine:inline-block">
              Right click (left)
            </span>
            <span className="hidden pointer-coarse:inline-block">
              Long press (left)
            </span>
          </div>
        </Pressable>
        <ContextMenu placement="left top">
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      </ContextMenuTrigger>
    </div>
  )
}
