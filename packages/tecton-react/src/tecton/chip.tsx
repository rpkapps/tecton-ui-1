"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  Button as ButtonPrimitive,
  composeRenderProps,
  TagGroup as TagGroupPrimitive,
  TagList as TagListPrimitive,
  Tag as TagPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
  type TagGroupProps,
  type TagListProps,
  type TagProps,
} from "react-aria-components"
import { XIcon } from "lucide-react"

import { badgeVariants } from "@tecton/react/components/badge"

/**
 * Tecton Chip — the *interactive* label: a selectable / removable tag inside
 * a `ChipGroup` (React Aria `TagGroup`, which has no shadcn counterpart).
 * Static labels are the shadcn `Badge`; a `Chip` reuses its `variant`,
 * `appearance` and `size` so both look identical.
 */
type ChipVariantProps = VariantProps<typeof badgeVariants>

function ChipGroup({ className, ...props }: TagGroupProps) {
  return (
    <TagGroupPrimitive
      data-slot="chip-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function ChipList<T extends object>({ className, ...props }: TagListProps<T>) {
  return (
    <TagListPrimitive
      data-slot="chip-list"
      className={composeRenderProps(className, (className) =>
        cn("flex flex-wrap gap-1.5", className)
      )}
      {...props}
    />
  )
}

function Chip({
  className,
  variant = "secondary",
  appearance = "solid",
  size = "default",
  children,
  ...props
}: ChipVariantProps &
  Omit<TagProps, "className" | "children"> & {
    className?: string
    children?: React.ReactNode
  }) {
  return (
    <TagPrimitive
      data-slot="chip"
      data-variant={variant}
      data-appearance={appearance}
      data-size={size}
      className={composeRenderProps(className, (className) =>
        cn(
          badgeVariants({ variant, appearance, size }),
          "cursor-pointer outline-none transition-colors select-none data-focus-visible:border-ring data-focus-visible:ring-2 data-focus-visible:ring-ring data-disabled:pointer-events-none data-disabled:opacity-50",
          // React Aria's Tag wraps its children, so the badge's `[&>svg]` sizes do not reach the icon.
          "data-[size=default]:**:data-[icon]:size-3 data-[size=md]:**:data-[icon]:size-3.5 data-[size=lg]:**:data-[icon]:size-4 **:data-[icon]:shrink-0",
          "data-hovered:brightness-110 data-selected:border-foreground data-selected:ring-1 data-selected:ring-foreground",
          className
        )
      )}
      {...props}
    >
      {({ allowsRemoving }) => (
        <>
          {children}
          {allowsRemoving && <ChipRemove slot="remove" />}
        </>
      )}
    </TagPrimitive>
  )
}

function ChipRemove({
  className,
  children,
  ...props
}: Omit<ButtonPrimitiveProps, "className"> & { className?: string }) {
  return (
    <ButtonPrimitive
      data-slot="chip-remove"
      aria-label="Remove"
      className={composeRenderProps(className, (className) =>
        cn(
          "-me-1 ms-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full opacity-70 outline-none hover:opacity-100 data-focus-visible:ring-2 data-focus-visible:ring-ring [&_svg]:size-3",
          className
        )
      )}
      {...props}
    >
      {children ?? <XIcon />}
    </ButtonPrimitive>
  )
}

export { Chip, ChipGroup, ChipList, ChipRemove }
export type { ChipVariantProps }
