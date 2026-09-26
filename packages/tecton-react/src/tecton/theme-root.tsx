"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { localeDirection, TectonProvider } from "@tecton/react/tecton/provider"

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
 * overrides. So `ThemeRoot` also owns one body-level overlay container that
 * carries the same `data-tecton-root` marker, the same classes as the root
 * (theme class, scope class, inline `[--token:…]` overrides) and the same
 * `dir`, and hands it to a `TectonProvider` (its `portalContainer`) for the
 * Tecton overlays to portal into. The container is `display: contents`, so a
 * layout class on the root (`flex h-full p-4`) has no effect there;
 * `overlayClassName` replaces the mirrored `className` when only some classes
 * should reach the overlays. Pass `overlayContainer` to reuse an element the
 * shell already owns, or `null` to opt out entirely.
 *
 * `dir` and `locale` are the application's reading direction and language:
 * they feed that `TectonProvider`, and the direction is also written as the
 * `dir` attribute of the root and of the container, which sits outside any
 * `dir` the shell put on an ancestor.
 *
 * The container is created in an effect, so overlays cannot be open before
 * mount: on the first paint there is no container yet and overlays portal
 * into `document.body`. Everything opened by an interaction — which is every
 * overlay in practice — sees the container.
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

type ThemeRootProps = Omit<React.ComponentProps<"div">, "dir"> &
  VariantProps<typeof themeRootVariants> & {
    /**
     * Overlay container to use instead of creating one; `null` disables the
     * overlay container (overlays then portal into `document.body`).
     */
    overlayContainer?: HTMLElement | null
    /**
     * Classes for the overlay container this root creates, instead of a copy
     * of `className`: the scope class and any `[--token:…]` overrides the
     * overlays need. The theme class is always added. Omit it to mirror
     * `className`; the container renders no box either way, so layout classes
     * never take up space at the end of the body.
     */
    overlayClassName?: string
    /**
     * Reading direction of the subtree: the `dir` attribute of the root and
     * of the overlay container, and the direction of its Tecton components.
     * Defaults to the direction of `locale`, else inherited.
     */
    dir?: "ltr" | "rtl"
    /** BCP 47 locale of the subtree (formatting, collation, direction). */
    locale?: string
  }

function ThemeRoot({
  className,
  theme = "inherit",
  overlayContainer,
  overlayClassName,
  dir,
  locale,
  children,
  ...props
}: ThemeRootProps) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null)
  const themeClass = themeRootVariants({ theme })
  const classes = cn(themeClass, className)
  const overlayClasses =
    overlayClassName === undefined ? classes : cn(themeClass, overlayClassName)
  // Only a direction this root decides is written to the DOM; without one the
  // root inherits its ancestors' `dir` like any element.
  const direction =
    dir ?? (locale !== undefined ? localeDirection(locale) : undefined)

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
    // The container is only a carrier for classes and inherited variables:
    // `display: contents` gives it no box, so a layout class copied from the
    // root (`flex h-full p-4`) cannot add a padded, full-height block to the
    // body, and it is no containing block for the overlays it holds. Inline,
    // so it wins over any `display` utility in the copied classes.
    element.style.display = "contents"
    document.body.append(element)
    setContainer(element)
    return () => {
      element.remove()
      setContainer(null)
    }
  }, [overlayContainer])

  React.useEffect(() => {
    // Keep the container in sync with the root: a theme flip, a scope class,
    // an inline `[--primary:…]` override or a direction has to reach the
    // overlays too. Only the container this component created is ours to
    // restyle.
    if (overlayContainer !== undefined || !container) return
    container.className = overlayClasses
    if (direction) container.setAttribute("dir", direction)
    else container.removeAttribute("dir")
  }, [container, overlayClasses, direction, overlayContainer])

  return (
    <div
      data-slot="theme-root"
      data-tecton-root=""
      className={classes}
      dir={direction}
      {...props}
    >
      <TectonProvider
        direction={dir}
        locale={locale}
        portalContainer={container}
      >
        {children}
      </TectonProvider>
    </div>
  )
}

export { ThemeRoot, themeRootVariants }
export type { ThemeRootProps }
