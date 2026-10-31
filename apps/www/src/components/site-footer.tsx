import { useRouterState } from "@tanstack/react-router"

import { siteConfig } from "@/lib/site"

export function SiteFooter() {
  // Docs pages have no footer. Decided from the route rather than a
  // `:has([data-slot=docs])` on <body>: that makes every element inserted
  // with a `data-slot` (a virtualized row, a menu) restyle the whole page.
  const isDocs = useRouterState({
    select: (s) =>
      s.location.pathname === "/docs" ||
      s.location.pathname.startsWith("/docs/"),
  })
  if (isDocs) return null

  return (
    <footer>
      <div className="container-wrapper px-4 xl:px-6">
        <div className="flex h-(--footer-height) items-center justify-between">
          <div className="w-full px-1 text-center text-xs leading-loose text-muted-foreground sm:text-sm">
            {siteConfig.name} is built on{" "}
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              shadcn/ui
            </a>{" "}
            and themed through the Tecton design tokens. Package:{" "}
            <span className="font-mono">{siteConfig.package}</span>.
          </div>
        </div>
      </div>
    </footer>
  )
}
