import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Tecton Badge — a count or dot anchored to the corner of its child
 * (avatar, icon button, tab). Not to be confused with the shadcn `Badge`
 * label component, which Tecton calls a Chip.
 */
const countBadgeVariants = cva(
  "pointer-events-none absolute z-10 flex items-center justify-center rounded-full font-medium tabular-nums whitespace-nowrap ring-2 ring-background",
  {
    variants: {
      color: {
        default: "bg-secondary text-secondary-foreground",
        primary: "bg-primary text-primary-foreground",
        error: "bg-destructive text-destructive-foreground",
        warning: "bg-warning text-warning-foreground",
        info: "bg-info text-info-foreground",
        success: "bg-success text-success-foreground",
        neutral: "bg-neutral text-neutral-foreground",
      },
      variant: {
        standard: "h-4 min-w-4 px-1 text-[0.625rem] leading-none",
        dot: "size-2",
      },
      anchor: {
        "top-right": "-top-1 -right-1",
        "top-left": "-top-1 -left-1",
        "bottom-right": "-right-1 -bottom-1",
        "bottom-left": "-bottom-1 -left-1",
      },
    },
    defaultVariants: {
      color: "primary",
      variant: "standard",
      anchor: "top-right",
    },
  }
)

type CountBadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof countBadgeVariants> & {
    /** Number to display. Hidden when 0 unless `showZero` is set. */
    count?: number
    /** Values above `max` render as `${max}+`. */
    max?: number
    showZero?: boolean
    /** Custom content instead of the count (e.g. "New"). */
    content?: React.ReactNode
    /** Hide the badge. */
    invisible?: boolean
  }

function CountBadge({
  className,
  color = "primary",
  variant = "standard",
  anchor = "top-right",
  count,
  max = 99,
  showZero = false,
  content,
  invisible = false,
  children,
  ...props
}: CountBadgeProps) {
  const hasCount = typeof count === "number"
  const hidden =
    invisible ||
    (variant === "standard" &&
      content === undefined &&
      (!hasCount || (count === 0 && !showZero)))

  const label =
    content !== undefined
      ? content
      : hasCount
        ? count > max
          ? `${max}+`
          : count
        : null

  return (
    <span
      data-slot="count-badge-anchor"
      className={cn("relative inline-flex shrink-0", className)}
      {...props}
    >
      {children}
      {!hidden && (
        <span
          data-slot="count-badge"
          data-variant={variant}
          data-color={color}
          className={countBadgeVariants({ color, variant, anchor })}
        >
          {variant === "standard" ? label : null}
        </span>
      )}
    </span>
  )
}

export { CountBadge, countBadgeVariants }
export type { CountBadgeProps }
