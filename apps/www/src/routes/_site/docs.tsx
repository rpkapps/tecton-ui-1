import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useFumadocsLoader } from "fumadocs-core/source/client"

import { DocsSidebar } from "@/components/docs-sidebar"
import { getPageTree } from "@/lib/page-tree"

export const Route = createFileRoute("/_site/docs")({
  loader: () => getPageTree(),
  component: DocsLayout,
})

function DocsLayout() {
  const { pageTree } = useFumadocsLoader(Route.useLoaderData())

  return (
    <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-1 items-start px-4 md:px-6">
      <DocsSidebar tree={pageTree} />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
