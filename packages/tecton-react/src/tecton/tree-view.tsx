"use client"

import * as React from "react"
import { cn } from "cn"
import {
  Button as ButtonPrimitive,
  Collection,
  composeRenderProps,
  TreeItemContent as TreeItemContentPrimitive,
  TreeItem as TreeItemPrimitive,
  Tree as TreePrimitive,
  type TreeItemProps as TreeItemPrimitiveProps,
  type TreeProps as TreePrimitiveProps,
} from "react-aria-components"
import {
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
  FolderIcon,
  FolderOpenIcon,
  MoreVerticalIcon,
} from "lucide-react"

/**
 * Tecton TreeView — hierarchical inventory / project / file structures on
 * React Aria `Tree`. Rows support folder or item kind, depth indentation,
 * selection, disabled and hidden states, a colour tag, a suffix (e.g. a
 * `Chip`) and an end adornment (visibility toggle, menu button).
 */
function TreeView<T extends object>({
  className,
  ...props
}: TreePrimitiveProps<T>) {
  return (
    <TreePrimitive
      data-slot="tree-view"
      className={composeRenderProps(className, (className) =>
        cn(
          "flex w-full flex-col gap-px overflow-auto text-sm outline-none data-focus-visible:ring-2 data-focus-visible:ring-ring/50",
          className
        )
      )}
      {...props}
    />
  )
}

type TreeViewItemProps<T extends object> = Omit<
  TreeItemPrimitiveProps<T>,
  "className"
> & {
  className?: string
  /** Dimmed "hidden" state (item is not visible in the viewport/model). */
  isHidden?: boolean
}

function TreeViewItem<T extends object>({
  className,
  isHidden,
  ...props
}: TreeViewItemProps<T>) {
  return (
    <TreeItemPrimitive
      data-slot="tree-view-item"
      data-hidden={isHidden ? "true" : undefined}
      className={composeRenderProps(className, (className) =>
        cn(
          "group/tree-item relative flex cursor-default items-center rounded-md outline-none select-none",
          "data-hovered:bg-accent/60 data-pressed:bg-accent data-selected:bg-accent data-selected:text-accent-foreground data-focus-visible:ring-2 data-focus-visible:ring-ring/60 data-focus-visible:ring-inset",
          "data-disabled:pointer-events-none data-disabled:opacity-50 data-[hidden=true]:text-muted-foreground",
          className
        )
      )}
      {...props}
    />
  )
}

type TreeViewItemContentProps = {
  className?: string
  children?: React.ReactNode
  /** Folder rows get a folder icon; item rows a small dot. */
  kind?: "folder" | "item"
  /** Custom leading icon (replaces the kind icon). */
  icon?: React.ReactNode
  /** Colour tag rendered after the icon (`ColorSwatch`, a coloured square…). */
  colorTag?: React.ReactNode
  /** Content after the label (e.g. a `Chip`). */
  suffix?: React.ReactNode
  /** Trailing content (visibility toggle, action menu…). */
  endAdornment?: React.ReactNode
}

function TreeViewItemContent({
  className,
  children,
  kind = "item",
  icon,
  colorTag,
  suffix,
  endAdornment,
}: TreeViewItemContentProps) {
  return (
    <TreeItemContentPrimitive>
      {({ hasChildItems, isExpanded, level }) => (
        <div
          data-slot="tree-view-item-content"
          data-kind={kind}
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center gap-1.5 pr-1",
            className
          )}
          style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.25}rem` }}
        >
          <ButtonPrimitive
            slot="chevron"
            data-slot="tree-view-chevron"
            aria-hidden={!hasChildItems}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none data-hovered:bg-accent data-hovered:text-foreground data-focus-visible:ring-2 data-focus-visible:ring-ring/60",
              !hasChildItems && "invisible"
            )}
          >
            <ChevronRightIcon
              className={cn(
                "size-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </ButtonPrimitive>
          <span
            data-slot="tree-view-icon"
            className="flex size-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4"
          >
            {icon ??
              (kind === "folder" ? (
                isExpanded ? (
                  <FolderOpenIcon />
                ) : (
                  <FolderIcon />
                )
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              ))}
          </span>
          {colorTag && (
            <span
              data-slot="tree-view-color-tag"
              className="flex shrink-0 items-center [&>*]:size-3 [&>*]:rounded-xs"
            >
              {colorTag}
            </span>
          )}
          <span data-slot="tree-view-label" className="min-w-0 flex-1 truncate">
            {children}
          </span>
          {suffix && (
            <span data-slot="tree-view-suffix" className="flex shrink-0 items-center">
              {suffix}
            </span>
          )}
          {endAdornment && (
            <span
              data-slot="tree-view-end"
              className="flex shrink-0 items-center gap-0.5 text-muted-foreground"
            >
              {endAdornment}
            </span>
          )}
        </div>
      )}
    </TreeItemContentPrimitive>
  )
}

function TreeViewAction({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof ButtonPrimitive>, "className"> & {
  className?: string
}) {
  return (
    <ButtonPrimitive
      data-slot="tree-view-action"
      className={composeRenderProps(className, (className) =>
        cn(
          "flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none data-hovered:bg-accent data-hovered:text-foreground data-focus-visible:ring-2 data-focus-visible:ring-ring/60 [&_svg]:size-4",
          className
        )
      )}
      {...props}
    >
      {children ?? <MoreVerticalIcon />}
    </ButtonPrimitive>
  )
}

function TreeViewVisibilityToggle({
  isVisible = true,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<typeof TreeViewAction>, "onPress" | "children"> & {
  isVisible?: boolean
  onChange?: (visible: boolean) => void
}) {
  return (
    <TreeViewAction
      aria-label={isVisible ? "Hide" : "Show"}
      aria-pressed={!isVisible}
      className={className}
      onPress={() => onChange?.(!isVisible)}
      {...props}
    >
      {isVisible ? <EyeIcon /> : <EyeOffIcon />}
    </TreeViewAction>
  )
}

export {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewAction,
  TreeViewVisibilityToggle,
  Collection as TreeViewCollection,
}
export type { TreeViewItemProps, TreeViewItemContentProps }
