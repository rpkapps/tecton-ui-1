"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { PortalProvider } from "@tecton/react/tecton/portal"

/**
 * Tecton ThemeRoot — the root element of an independently deployed
 * application (a Module Federation remote, an embedded widget) that brings
 * its own copy of Tecton.
 *
 * It marks that element with `data-tecton-root`. The remote compiles its own
 * utilities from the generated `scoped.css` and wraps them in `@scope`; the
 * theme variables themselves are not redeclared here — they inherit from the
 * shell's `:root` like any custom property, so a shell customisation reaches
 * the remote untouched. The marker is what the scoped base reset and the
 * opt-in `scoped-theme.css` (a remote without a Tecton shell, or with its own
 * token set) key on.
 *
 * Overlays are the hole in that scheme — a Dialog, Sheet, Popover, Tooltip,
 * Select, Combobox or Menu portals out of the subtree and would land in a
 * bare `document.body`, outside the remote's `@scope` rule and its class
 * overrides. So `ThemeRoot` also owns one body-level overlay container
 * that carries the same `data-tecton-root` marker and the same classes as the
 * root (theme class, scope class, inline `[--token:…]` overrides), and hands
 * it to `PortalProvider` for the Tecton overlays to portal into. Pass
 * `overlayContainer` to reuse an element the shell already owns, or `null` to
 * opt out entirely.
 *
 * The container is created in an effect, so overlays cannot be open before
 * mount: on the first paint there is no container yet, `usePortalTarget()`
 * returns `undefined` and React Aria resolves its own default. Everything
 * opened by an interaction — which is every overlay in practice — sees the
 * container.
 */
const themeRootVariants = cva("", {
  variants: {
    theme: {
      dark: "dark",
      light: "light",
      inherit: "",
    },
  },
  defaultVariants: {
    theme: "inherit",
  },
})

type ThemeRootProps = React.ComponentProps<"div"> &
  VariantProps<typeof themeRootVariants> & {
    /**
     * Overlay container to use instead of creating one; `null` disables the
     * overlay container (overlays fall back to React Aria's default).
     */
    overlayContainer?: HTMLElement | null
  }

function ThemeRoot({
  className,
  theme = "inherit",
  overlayContainer,
  children,
  ...props
}: ThemeRootProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [container, setContainer] = React.useState<HTMLElement | null>(null)
  const classes = cn(themeRootVariants({ theme }), className)

  React.useEffect(() => {
    // A caller-supplied container (or `null`) is used as is and never owned.
    if (overlayContainer !== undefined) {
      setContainer(overlayContainer)
      return () => setContainer(null)
    }
    if (typeof document === "undefined") return
    const element = document.createElement("div")
    element.setAttribute("data-tecton-root", "")
    element.setAttribute("data-slot", "theme-root-overlay")
    element.className = ref.current?.className ?? ""
    document.body.append(element)
    setContainer(element)
    return () => {
      element.remove()
      setContainer(null)
    }
  }, [overlayContainer])

  React.useEffect(() => {
    // Keep the container in sync with the root: a theme flip, a scope class or
    // an inline `[--primary:…]` override has to reach the overlays too. Only
    // the container this component created is ours to restyle.
    if (overlayContainer !== undefined || !container) return
    container.className = classes
  }, [container, classes, overlayContainer])

  return (
    <div
      ref={ref}
      data-slot="theme-root"
      data-tecton-root=""
      className={classes}
      {...props}
    >
      <PortalProvider container={container}>{children}</PortalProvider>
    </div>
  )
}

export { ThemeRoot, themeRootVariants }
export type { ThemeRootProps }
