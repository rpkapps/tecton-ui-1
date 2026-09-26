"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  composeRenderProps,
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components"
import { ExternalLinkIcon } from "lucide-react"

/**
 * Tecton Link — inline text link on React Aria `Link`.
 * variant: default (foreground, underline on hover), primary, muted,
 * subtle (always underlined). `isExternal` appends an icon and sets
 * target/rel.
 */
const linkVariants = cva(
  "inline-flex items-center gap-1 rounded-xs underline-offset-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 data-focus-visible:ring-2 data-focus-visible:ring-ring/60 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-[0.85em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-foreground data-hovered:underline",
        // The Tecton text-only action colours (Button variant="link"), not
        // `primary-foreground`: that is the text *on* a primary fill and is
        // near-white on a light page.
        primary:
          "text-link-foreground data-hovered:text-link-hover-foreground data-hovered:underline data-pressed:text-link-pressed-foreground",
        muted:
          "text-muted-foreground data-hovered:text-foreground data-hovered:underline",
        subtle:
          "text-foreground underline decoration-border data-hovered:decoration-current",
      },
      size: {
        inherit: "",
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "inherit",
    },
  }
)

type LinkProps = Omit<LinkPrimitiveProps, "className" | "children"> &
  VariantProps<typeof linkVariants> & {
    className?: string
    children?: React.ReactNode
    isExternal?: boolean
  }

function Link({
  className,
  variant = "default",
  size = "inherit",
  isExternal,
  target,
  rel,
  children,
  ...props
}: LinkProps) {
  // An external link always keeps `noreferrer noopener`; a caller's `rel`
  // (e.g. `nofollow`) is added to it, never swapped for it.
  const relValue =
    [isExternal && "noreferrer noopener", rel].filter(Boolean).join(" ") ||
    undefined
  return (
    <LinkPrimitive
      data-slot="link"
      data-variant={variant}
      className={composeRenderProps(className, (className) =>
        cn(linkVariants({ variant, size }), className)
      )}
      {...props}
      target={target ?? (isExternal ? "_blank" : undefined)}
      rel={relValue}
    >
      {children}
      {isExternal && <ExternalLinkIcon aria-hidden />}
    </LinkPrimitive>
  )
}

export { Link, linkVariants }
export type { LinkProps }
