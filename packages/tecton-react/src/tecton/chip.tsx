"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
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

/**
 * Tecton Chip — compact label for attributes, filters and selections.
 * color × variant (filled / outlined) × size (md / sm / xs), optionally
 * clickable (pass `onPress`) and deletable (`<ChipRemove />` or a
 * `ChipTag` inside a `ChipGroup` with `onRemove`).
 */
const chipVariants = cva(
  "group/chip inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-transparent font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-focus-visible:border-ring data-focus-visible:ring-3 data-focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      color: {
        default: "",
        primary: "",
        error: "",
        warning: "",
        info: "",
        success: "",
      },
      variant: {
        filled: "",
        outlined: "bg-transparent",
      },
      size: {
        md: "h-7 px-2.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        sm: "h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 px-1.5 text-[0.625rem] [&_svg:not([class*='size-'])]:size-3",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    compoundVariants: [
      // filled
      {
        color: "default",
        variant: "filled",
        className:
          "bg-secondary text-secondary-foreground data-hovered:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_8%)] data-selected:bg-accent data-selected:text-accent-foreground",
      },
      {
        color: "primary",
        variant: "filled",
        className:
          "bg-primary text-primary-foreground data-hovered:bg-primary/80 data-selected:bg-primary/70",
      },
      {
        color: "error",
        variant: "filled",
        className:
          "bg-destructive text-destructive-foreground data-hovered:bg-destructive/80",
      },
      {
        color: "warning",
        variant: "filled",
        className:
          "bg-warning text-warning-foreground data-hovered:bg-warning/80",
      },
      {
        color: "info",
        variant: "filled",
        className: "bg-info text-info-foreground data-hovered:bg-info/80",
      },
      {
        color: "success",
        variant: "filled",
        className:
          "bg-success text-success-foreground data-hovered:bg-success/80",
      },
      // outlined
      {
        color: "default",
        variant: "outlined",
        className:
          "border-border text-foreground data-hovered:bg-accent data-selected:bg-accent",
      },
      {
        color: "primary",
        variant: "outlined",
        className:
          "border-primary text-foreground data-hovered:bg-primary/15 data-selected:bg-primary/25",
      },
      {
        color: "error",
        variant: "outlined",
        className:
          "border-destructive text-destructive data-hovered:bg-destructive/10",
      },
      {
        color: "warning",
        variant: "outlined",
        className: "border-warning text-warning data-hovered:bg-warning/10",
      },
      {
        color: "info",
        variant: "outlined",
        className: "border-info text-info data-hovered:bg-info/10",
      },
      {
        color: "success",
        variant: "outlined",
        className: "border-success text-success data-hovered:bg-success/10",
      },
    ],
    defaultVariants: {
      color: "default",
      variant: "filled",
      size: "md",
      interactive: false,
    },
  }
)

type ChipVariantProps = Omit<VariantProps<typeof chipVariants>, "interactive">

type ChipProps = ChipVariantProps &
  Omit<ButtonPrimitiveProps, "className" | "children"> & {
    className?: string
    children?: React.ReactNode
  }

function Chip({
  className,
  color = "default",
  variant = "filled",
  size = "md",
  children,
  onPress,
  isDisabled,
  ...props
}: ChipProps) {
  const interactive = typeof onPress === "function"
  const classes = cn(
    chipVariants({ color, variant, size, interactive }),
    className
  )

  if (interactive) {
    return (
      <ButtonPrimitive
        data-slot="chip"
        data-color={color}
        data-variant={variant}
        data-size={size}
        className={classes}
        onPress={onPress}
        isDisabled={isDisabled}
        {...props}
      >
        {children}
      </ButtonPrimitive>
    )
  }

  return (
    <span
      data-slot="chip"
      data-color={color}
      data-variant={variant}
      data-size={size}
      data-disabled={isDisabled || undefined}
      className={classes}
      aria-disabled={isDisabled || undefined}
    >
      {children}
    </span>
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
          "-mr-1 ml-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/60 data-focus-visible:ring-2 data-focus-visible:ring-ring/60 [&_svg]:size-3",
          className
        )
      )}
      {...props}
    >
      {children ?? <XIcon />}
    </ButtonPrimitive>
  )
}

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

function ChipTag({
  className,
  color = "default",
  variant = "filled",
  size = "md",
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
      data-color={color}
      data-variant={variant}
      data-size={size}
      className={composeRenderProps(className, (className) =>
        cn(chipVariants({ color, variant, size, interactive: true }), className)
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

export { Chip, ChipRemove, ChipGroup, ChipList, ChipTag, chipVariants }
export type { ChipProps }
