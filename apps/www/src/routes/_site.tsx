import * as React from "react"
import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router"
import { useFumadocsLoader } from "fumadocs-core/source/client"

import { NotFound } from "@/components/not-found"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { getPageTree } from "@/lib/page-tree"

export const Route = createFileRoute("/_site")({
  loader: () => getPageTree(),
  // The page tree is static content: fetch it once, not on every navigation
  // or link preload.
  staleTime: Infinity,
  preloadStaleTime: Infinity,
  // Unknown URLs render inside the site chrome.
  notFoundComponent: NotFound,
  component: SiteLayout,
})

/**
 * After a client-side navigation to another page, move focus to the main
 * content (as a full page load would reset it), so keyboard and screen reader
 * users start at the new page instead of the link they pressed. Hash changes
 * keep the focus where the browser puts it.
 */
function useFocusMainOnNavigation(main: React.RefObject<HTMLElement | null>) {
  const router = useRouter()
  React.useEffect(
    () =>
      router.subscribe("onRendered", (event) => {
        if (!event.fromLocation || !event.pathChanged) return
        const target =
          main.current?.querySelector<HTMLElement>("h1") ?? main.current
        if (!target) return
        if (target !== main.current && !target.hasAttribute("tabindex"))
          target.setAttribute("tabindex", "-1")
        target.focus({ preventScroll: true })
      }),
    [router, main]
  )
}

function SiteLayout() {
  const { pageTree } = useFumadocsLoader(Route.useLoaderData())
  const main = React.useRef<HTMLElement>(null)
  useFocusMainOnNavigation(main)

  return (
    <div
      data-slot="layout"
      className="group/layout relative z-10 flex min-h-svh flex-col bg-background"
    >
      <a
        href="#content"
        className="sr-only z-[60] rounded-md bg-background px-3 py-2 text-sm font-medium ring-2 ring-ring focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader tree={pageTree} />
      <main
        ref={main}
        id="content"
        tabIndex={-1}
        className="flex min-h-0 flex-1 flex-col outline-none [&_h1:focus]:outline-none"
      >
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
