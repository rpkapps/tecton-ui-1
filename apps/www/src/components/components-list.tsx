import { Link } from "@tanstack/react-router"

import { docs } from "@/lib/docs"

/** Grid of all component pages (standard or Tecton). */
export function ComponentsList({ section = "components" }: { section?: "components" | "tecton" }) {
  const pages = docs.docs
    .filter(
      (page) =>
        page.info.path.startsWith(`${section}/`) && !page.info.path.endsWith("index.mdx")
    )
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div data-not-typeset className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pages.map((page) => (
        <Link
          key={page.info.path}
          to="/docs/$"
          params={{ _splat: page.info.path.replace(/\.mdx$/, "") }}
          className="flex flex-col gap-1 rounded-lg border bg-card p-4 outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <span className="text-sm font-medium">{page.title}</span>
          <span className="line-clamp-2 text-xs text-muted-foreground">{page.description}</span>
        </Link>
      ))}
    </div>
  )
}
