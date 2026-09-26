import { getRouteApi, Link } from "@tanstack/react-router"
import { useFumadocsLoader } from "fumadocs-core/source/client"

import { getPagesFromFolder, getRootFolders, nodeName } from "@/lib/tree"

const siteRoute = getRouteApi("/_site")

/** Text-link grid of all component pages of a section (like the shadcn docs). */
export function ComponentsList({
  section = "components",
}: {
  section?: "components" | "tecton"
}) {
  const { pageTree } = useFumadocsLoader(siteRoute.useLoaderData())
  const prefix = `/docs/${section}/`
  const pages = getRootFolders(pageTree)
    .flatMap(getPagesFromFolder)
    .filter((page) => page.url.startsWith(prefix))
    .map((page) => ({ url: page.url, title: nodeName(page) }))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div
      data-not-typeset
      className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-x-8 lg:gap-x-16 lg:gap-y-6 xl:gap-x-20"
    >
      {pages.map((page) => (
        <Link
          key={page.url}
          to="/docs/$"
          params={{ _splat: page.url.slice("/docs/".length) }}
          className="inline-flex items-center gap-2 text-lg font-medium underline-offset-4 hover:underline md:text-base"
        >
          {page.title}
        </Link>
      ))}
    </div>
  )
}
