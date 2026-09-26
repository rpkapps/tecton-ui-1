"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  Button as ButtonPrimitive,
  ListStateContext,
  TagGroup as TagGroupPrimitive,
  TagList as TagListPrimitive,
  Tag as TagPrimitive,
  type Selection,
} from "react-aria-components"
import { XIcon } from "lucide-react"

import { badgeVariants } from "@tecton/react/components/badge"

import { AriaBridge } from "./internal/aria-bridge"

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

type ChipListState = NonNullable<React.ContextType<typeof ListStateContext>>

type ChipGroupContextValue = {
  disabled: boolean
  /** The group's live state, for the values behind a "select all". */
  state: React.RefObject<ChipListState | null>
}

const ChipGroupContext = React.createContext<ChipGroupContextValue | null>(null)

// The state attributes of the underlying primitives. Tecton keeps the ones
// consumers style, as presence attributes, and drops the rest: hover and
// keyboard focus are `:hover` and `:focus-visible`.
const PRIMITIVE_ATTRIBUTES = [
  "data-rac",
  "data-hovered",
  "data-focused",
  "data-focus-visible",
  "data-pressed",
  "data-pending",
  "data-allows-removing",
  "data-selection-mode",
]
const PRESENCE_ATTRIBUTES = ["data-selected", "data-disabled", "data-empty"]

function withStateAttributes<TProps extends object>(props: TProps): TProps {
  const next = { ...props } as Record<string, unknown>
  for (const name of PRIMITIVE_ATTRIBUTES) delete next[name]
  for (const name of PRESENCE_ATTRIBUTES) {
    if (next[name]) next[name] = ""
    else delete next[name]
  }
  return next as TProps
}

function renderDiv(props: React.ComponentProps<"div">) {
  return <div {...withStateAttributes(props)} />
}

function ChipGroup({
  selectionMode = "none",
  value,
  defaultValue,
  onValueChange,
  disallowEmptySelection,
  disabled = false,
  onRemove,
  className,
  ...props
}: ChipGroupProps) {
  const state = React.useRef<ChipListState | null>(null)
  const context = React.useMemo(() => ({ disabled, state }), [disabled])

  const toValue = (keys: Selection): string[] => {
    if (keys !== "all") return [...keys].map(String)
    // "Select all" (Ctrl+A): every chip that can be selected.
    const current = state.current
    if (current === null) return []
    return [...current.collection.getKeys()]
      .filter((key) => current.selectionManager.canSelectItem(key))
      .map(String)
  }

  return (
    <AriaBridge>
      <ChipGroupContext value={context}>
        <TagGroupPrimitive
          data-slot="chip-group"
          className={cn("flex flex-col gap-2", className)}
          selectionMode={selectionMode}
          selectedKeys={value}
          defaultSelectedKeys={defaultValue}
          onSelectionChange={
            onValueChange && ((keys) => onValueChange(toValue(keys)))
          }
          disallowEmptySelection={disallowEmptySelection}
          onRemove={onRemove && ((keys) => onRemove([...keys].map(String)))}
          {...props}
        />
      </ChipGroupContext>
    </AriaBridge>
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
  const group = React.useContext(ChipGroupContext)
  const state = React.useContext(ListStateContext)
  React.useLayoutEffect(() => {
    if (group !== null && state !== null) group.state.current = state
  })

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
    <TagListPrimitive
      data-slot="chip-list"
      className={cn("flex flex-wrap gap-1.5", className)}
      renderEmptyState={empty === undefined ? undefined : () => empty}
      render={renderDiv}
      {...props}
    >
      {chips}
    </TagListPrimitive>
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
  ...props
}: ChipProps) {
  const group = React.useContext(ChipGroupContext)
  return (
    <TagPrimitive
      id={value}
      textValue={label ?? (textOf(children).trim() || value)}
      isDisabled={disabled || group?.disabled}
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
      render={renderDiv}
      {...props}
    >
      {({ allowsRemoving }) => (
        <>
          {children}
          {allowsRemoving && <RemoveButton />}
        </>
      )}
    </TagPrimitive>
  )
}

type ChipRemoveProps = {
  className?: string
  /** Replaces the X icon. */
  children?: React.ReactNode
  "aria-label"?: string
}

/**
 * The remove button of a chip. A chip in a group with `onRemove` renders its
 * own, named "Remove" plus the chip's text in the group's locale.
 */
function RemoveButton({ className, children, ...props }: ChipRemoveProps) {
  return (
    <ButtonPrimitive
      slot="remove"
      data-slot="chip-remove"
      className={cn(
        "ms-0.5 -me-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3",
        className
      )}
      render={(buttonProps) => <button {...withStateAttributes(buttonProps)} />}
      {...props}
    >
      {children ?? <XIcon />}
    </ButtonPrimitive>
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
