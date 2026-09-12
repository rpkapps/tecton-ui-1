"use client"

import * as React from "react"
import { cn } from "cn"
import type { TOCItemType } from "fumadocs-core/toc"

export function DocsToc({ toc }: { toc: TOCItemType[] }) {
  const items = toc.filter((item) => item.depth <= 3)
  const [active, setActive] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!items.length) return
    const headings = items
      .map((item) => document.getElementById(item.url.slice(1)))
      .filter((el): el is HTMLElement => Boolean(el))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(`#${visible[0].target.id}`)
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] }
    )
    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (!items.length) return null

  return (
    <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-52 shrink-0 py-10 xl:block">
      <p className="mb-2 text-xs font-medium text-muted-foreground">On this page</p>
      <ul className="flex flex-col gap-1 text-sm">
        {items.map((item) => (
          <li key={item.url} style={{ paddingLeft: (item.depth - 2) * 12 }}>
            <a
              href={item.url}
              className={cn(
                "block truncate text-muted-foreground transition-colors hover:text-foreground",
                active === item.url && "text-foreground"
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
