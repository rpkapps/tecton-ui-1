"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { XIcon } from "lucide-react"

import { badgeVariants } from "@tecton/react/components/badge"

import { ChipPrimitive } from "./internal/primitives/chip/index"

/**
 * Tecton Chip — the *interactive* label: a selectable / removable chip in a
 * `ChipGroup`, a grid of rows moved through with the arrow keys (it has no
 * shadcn counterpart). Static labels are the shadcn `Badge`; a `Chip` reuses
 * its `variant`, `appearance` and `size` so both look identical.
 *
 * Styling hooks: `data-selected` and `data-disabled` on a chip, `data-empty`
 * on the list (presence attributes); hover and keyboard focus are `:hover`
 * and `:focus-visible`.
 */
type ChipVariantProps = VariantProps<typeof badgeVariants>

type ChipSelectionMode = "none" | "single" | "multiple"

type ChipGroupProps = {
  /** Whether chips can be selected, and how many at once. */
  selectionMode?: ChipSelectionMode
  /** The selected chips' values, controlled. */
  value?: string[]
  /** The selected chips' values at first, uncontrolled. */
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Keeps at least one chip selected: the last one cannot be deselected. */
  disallowEmptySelection?: boolean
  /** Disables every chip in the group. */
  disabled?: boolean
  /**
   * Makes the chips removable: each gets a remove button, and Delete or
   * Backspace removes the focused one (or the selected ones, when it is
   * selected). Called with the values to remove.
   */
  onRemove?: (values: string[]) => void
  id?: string
  className?: string
  style?: React.CSSProperties
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  children?: React.ReactNode
}

function ChipGroup({
  selectionMode = "none",
  onValueChange,
  onRemove,
  className,
  ...props
}: ChipGroupProps) {
  return (
    <ChipPrimitive.Root
      data-slot="chip-group"
      className={cn("flex flex-col gap-2", className)}
      selectionMode={selectionMode}
      onValueChange={onValueChange && ((value) => onValueChange(value))}
      onRemove={onRemove && ((values) => onRemove(values))}
      {...props}
    />
  )
}

type ChipListProps<T> = {
  /** The data to render a chip for each, with a function as `children`. */
  items?: Iterable<T>
  /** The chips, or a function that renders one for an item of `items`. */
  children?: React.ReactNode | ((item: T) => React.ReactElement<ChipProps>)
  /** Shown in place of the chips when there are none. */
  empty?: React.ReactNode
  id?: string
  className?: string
  style?: React.CSSProperties
}

function ChipList<T>({
  items,
  children,
  empty,
  className,
  ...props
}: ChipListProps<T>) {
  const chips =
    typeof children === "function"
      ? Array.from(items ?? [], (item) => {
          const chip = children(item)
          return React.cloneElement(chip, {
            key: chip.key ?? chip.props.value,
          })
        })
      : children

  return (
    <ChipPrimitive.List
      data-slot="chip-list"
      className={cn("flex flex-wrap gap-1.5", className)}
      empty={empty}
      {...props}
    >
      {chips}
    </ChipPrimitive.List>
  )
}

type ChipProps = ChipVariantProps & {
  /** The chip's identity: what `value`, `onValueChange` and `onRemove` hold. */
  value: string
  /** The chip's text, for typeahead and screen readers; defaults to the text of `children`. */
  label?: string
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  "aria-label"?: string
  children?: React.ReactNode
}

/** The plain text of some children, for a chip with no `label`. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textOf(node.props.children)
  }
  return ""
}

function Chip({
  value,
  label,
  disabled,
  className,
  variant = "secondary",
  appearance = "solid",
  size = "default",
  children,
  "aria-label": ariaLabel,
  ...props
}: ChipProps) {
  return (
    <ChipPrimitive.Chip
      value={value}
      textValue={ariaLabel ?? label ?? (textOf(children).trim() || value)}
      disabled={disabled}
      data-slot="chip"
      data-variant={variant}
      data-appearance={appearance}
      data-size={size}
      className={cn(
        badgeVariants({ variant, appearance, size }),
        "cursor-pointer transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-disabled:opacity-50",
        // The chip wraps its children in a grid cell, so the badge's `[&>svg]` sizes do not reach the icon.
        "**:data-[icon]:shrink-0 data-[size=default]:**:data-[icon]:size-3 data-[size=lg]:**:data-[icon]:size-4 data-[size=md]:**:data-[icon]:size-3.5",
        "hover:brightness-110 data-[selected]:border-foreground data-[selected]:ring-1 data-[selected]:ring-foreground",
        className
      )}
      {...props}
    >
      {({ removable }) => (
        <>
          {children}
          {removable && <RemoveButton />}
        </>
      )}
    </ChipPrimitive.Chip>
  )
}

type ChipRemoveProps = {
  className?: string
  /** Replaces the X icon. */
  children?: React.ReactNode
  "aria-label"?: string
}

const removeButtonClassName =
  "ms-0.5 -me-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3"

/**
 * The remove button of a chip. A chip in a group with `onRemove` renders its
 * own, named "Remove" plus the chip's text in the group's locale.
 */
function RemoveButton({ className, children, ...props }: ChipRemoveProps) {
  return (
    <ChipPrimitive.Remove
      data-slot="chip-remove"
      className={cn(removeButtonClassName, className)}
      {...props}
    >
      {children ?? <XIcon />}
    </ChipPrimitive.Remove>
  )
}

function ChipRemove({
  "aria-label": ariaLabel = "Remove",
  ...props
}: ChipRemoveProps) {
  return <RemoveButton aria-label={ariaLabel} {...props} />
}

export { Chip, ChipGroup, ChipList, ChipRemove }
export type {
  ChipGroupProps,
  ChipListProps,
  ChipProps,
  ChipRemoveProps,
  ChipSelectionMode,
  ChipVariantProps,
}
