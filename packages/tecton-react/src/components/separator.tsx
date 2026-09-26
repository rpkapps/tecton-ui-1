"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const separatorVariants = cva(
  "shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
  {
    variants: {
      emphasis: {
        subtle: "bg-border-subtle",
        default: "bg-border",
        strong: "bg-border-strong",
      },
    },
    defaultVariants: {
      emphasis: "default",
    },
  }
)

function Separator({
  className,
  orientation = "horizontal",
  emphasis = "default",
  ...props
}: SeparatorPrimitive.Props & VariantProps<typeof separatorVariants>) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      data-emphasis={emphasis}
      orientation={orientation}
      className={cn(separatorVariants({ emphasis }), className)}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
