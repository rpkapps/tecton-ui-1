import * as React from "react"
import { Link as RouterLink } from "@tanstack/react-router"

/** Minimal stand-in for `next/link` used by upstream shadcn examples. */
export default function Link({
  href,
  children,
  prefetch: _prefetch,
  ...props
}: Omit<React.ComponentProps<"a">, "href"> & {
  href: string
  prefetch?: boolean
}) {
  if (href.startsWith("/")) {
    return (
      <RouterLink to={href} {...(props as object)}>
        {children}
      </RouterLink>
    )
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}
