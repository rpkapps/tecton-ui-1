import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { Separator } from "@tecton/react/components/separator"

/**
 * Tecton Divider — the shadcn `Separator` with Tecton's three emphasis
 * levels (subtle / medium / strong) and an optional inline label.
 */
const dividerVariants = cva("", {
  variants: {
    emphasis: {
      subtle: "bg-border-subtle",
      medium: "bg-border",
      strong: "bg-border-strong",
    },
  },
  defaultVariants: {
    emphasis: "medium",
  },
})

type DividerProps = React.ComponentProps<typeof Separator> &
  VariantProps<typeof dividerVariants> & {
    /** Inline label rendered in the middle of a horizontal divider. */
    children?: React.ReactNode
  }

function Divider({
  className,
  emphasis = "medium",
  orientation = "horizontal",
  children,
  ...props
}: DividerProps) {
  if (children && orientation === "horizontal") {
    return (
      <div
        data-slot="divider"
        data-emphasis={emphasis}
        role="separator"
        aria-orientation="horizontal"
        className={cn(
          "flex w-full items-center gap-3 text-xs text-muted-foreground",
          className
        )}
      >
        <Separator
          aria-hidden
          className={cn("flex-1", dividerVariants({ emphasis }))}
        />
        <span data-slot="divider-label" className="shrink-0">
          {children}
        </span>
        <Separator
          aria-hidden
          className={cn("flex-1", dividerVariants({ emphasis }))}
        />
      </div>
    )
  }

  return (
    <Separator
      data-slot="divider"
      data-emphasis={emphasis}
      orientation={orientation}
      className={cn(dividerVariants({ emphasis }), className)}
      {...props}
    />
  )
}

export { Divider, dividerVariants }
export type { DividerProps }
