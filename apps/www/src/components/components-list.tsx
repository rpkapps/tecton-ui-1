import { Link } from "@tanstack/react-router"

import { docs } from "@/lib/docs"

/** Text-link grid of all component pages of a section (like the shadcn docs). */
export function ComponentsList({
  section = "components",
}: {
  section?: "components" | "tecton"
}) {
  const pages = docs.docs
    .filter(
      (page) =>
        page.info.path.startsWith(`${section}/`) &&
        !page.info.path.endsWith("index.mdx")
    )
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div
      data-not-typeset
      className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-x-8 lg:gap-x-16 lg:gap-y-6 xl:gap-x-20"
    >
      {pages.map((page) => (
        <Link
          key={page.info.path}
          to="/docs/$"
          params={{ _splat: page.info.path.replace(/\.mdx$/, "") }}
          className="inline-flex items-center gap-2 text-lg font-medium underline-offset-4 hover:underline md:text-base"
        >
          {page.title}
        </Link>
      ))}
    </div>
  )
}
