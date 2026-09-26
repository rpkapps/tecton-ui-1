"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { ExternalLinkIcon } from "lucide-react"

import { buttonVariants } from "@tecton/react/components/button"
import {
  shouldClientNavigate,
  useTectonRouter,
} from "@tecton/react/tecton/provider"

/**
 * Tecton Link — an inline text link rendered as an `<a>`.
 * variant: default (foreground, underline on hover), primary, muted,
 * subtle (always underlined). `external` appends an icon and sets
 * target/rel. Navigates through the `TectonProvider` router when one is set.
 */
const linkVariants = cva(
  "inline-flex items-center gap-1 rounded-xs underline-offset-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-[0.85em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-foreground hover:underline",
        // The Tecton text-only action colours (Button variant="link"), not
        // `primary-foreground`: that is the text *on* a primary fill and is
        // near-white on a light page.
        primary:
          "text-link-foreground hover:text-link-hover-foreground hover:underline active:text-link-pressed-foreground",
        muted: "text-muted-foreground hover:text-foreground hover:underline",
        subtle:
          "text-foreground underline decoration-border hover:decoration-current",
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

type AnchorProps = {
  /** Disables the link: no `href`, no navigation, not focusable. */
  disabled?: boolean
  /** Second argument of the `TectonProvider` `navigate` (router options). */
  navigateOptions?: unknown
}

/**
 * The anchor behaviour Link and LinkButton share: the router's `useHref`
 * maps `href` for rendering, a plain click on a same-origin link goes to the
 * router's `navigate`, and a disabled link drops its `href` (so it neither
 * navigates nor takes focus) but keeps `role="link"` and `aria-disabled`.
 */
function useAnchorProps({
  href,
  disabled,
  navigateOptions,
  onClick,
}: {
  href?: string
  disabled?: boolean
  navigateOptions?: unknown
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}): React.ComponentProps<"a"> {
  const { navigate, useHref: useRouterHref } = useTectonRouter()
  // A hook from the provider: called on every render while it is set.
  const routerHref = useRouterHref ? useRouterHref(href ?? "") : undefined
  const renderedHref = href === undefined ? undefined : (routerHref ?? href)

  if (disabled) {
    return {
      role: "link",
      "aria-disabled": true,
      onClick: (event) => event.preventDefault(),
    }
  }
  return {
    href: renderedHref,
    onClick: (event) => {
      onClick?.(event)
      if (!navigate || href === undefined) return
      if (shouldClientNavigate(event, event.currentTarget)) {
        event.preventDefault()
        navigate(href, navigateOptions)
      }
    },
  }
}

type LinkProps = Omit<useRender.ComponentProps<"a">, "href"> &
  VariantProps<typeof linkVariants> &
  AnchorProps & {
    href?: string
    /** Opens in a new tab with a safe `rel` and appends an external icon. */
    external?: boolean
  }

function Link({
  className,
  variant = "default",
  size = "inherit",
  external,
  disabled,
  navigateOptions,
  href,
  target,
  rel,
  onClick,
  render,
  children,
  ...props
}: LinkProps) {
  const anchorProps = useAnchorProps({
    href,
    disabled,
    navigateOptions,
    onClick,
  })
  // An external link always keeps `noreferrer noopener`; a caller's `rel`
  // (e.g. `nofollow`) is added to it, never swapped for it.
  const relValue =
    [external && "noreferrer noopener", rel].filter(Boolean).join(" ") ||
    undefined
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className: cn(linkVariants({ variant, size }), className),
        target: target ?? (external ? "_blank" : undefined),
        rel: relValue,
        children: (
          <>
            {children}
            {external && <ExternalLinkIcon aria-hidden />}
          </>
        ),
      },
      props,
      anchorProps
    ),
    state: { slot: "link", variant, disabled: disabled ?? false },
  })
}

type LinkButtonProps = Omit<useRender.ComponentProps<"a">, "href"> &
  VariantProps<typeof buttonVariants> &
  AnchorProps & {
    href?: string
  }

/**
 * Tecton LinkButton — navigation that looks like a `Button`: the button
 * variants and sizes on an `<a>`, with the same router and disabled
 * behaviour as `Link`.
 */
function LinkButton({
  className,
  variant = "default",
  size = "default",
  disabled,
  navigateOptions,
  href,
  onClick,
  render,
  ...props
}: LinkButtonProps) {
  const anchorProps = useAnchorProps({
    href,
    disabled,
    navigateOptions,
    onClick,
  })
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className: cn(
          buttonVariants({ variant, size }),
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className
        ),
      },
      props,
      anchorProps
    ),
    state: {
      slot: "button",
      variant,
      size,
      disabled: disabled ?? false,
    },
  })
}

export { Link, LinkButton, linkVariants }
export type { LinkProps, LinkButtonProps }
