import { createFileRoute, Outlet } from "@tanstack/react-router"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
})

function SiteLayout() {
  return (
    <div className="relative flex min-h-svh flex-col">
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  )
}
