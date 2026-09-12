"use client"

import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "cn"
import type * as PageTree from "fumadocs-core/page-tree"

import { ScrollArea } from "@tecton/react/components/scroll-area"

function nodeKey(node: PageTree.Node, index: number) {
  return node.$id ?? `${String(node.name)}-${index}`
}

function Node({ node, pathname }: { node: PageTree.Node; pathname: string }) {
  if (node.type === "separator") {
    return (
      <li className="mt-6 mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase first:mt-0">
        {node.name}
      </li>
    )
  }
  if (node.type === "folder") {
    return (
      <li className="mt-6 first:mt-0">
        {node.index ? (
          <Link
            to={node.index.url}
            className={cn(
              "block rounded-md px-2 py-1 text-sm font-medium hover:text-foreground",
              pathname === node.index.url ? "text-foreground" : "text-foreground/90"
            )}
          >
            {node.name}
          </Link>
        ) : (
          <span className="block px-2 py-1 text-sm font-medium">{node.name}</span>
        )}
        <ul className="mt-1 flex flex-col gap-px border-l border-border-subtle pl-2">
          {node.children.map((child, i) => (
            <Node key={nodeKey(child, i)} node={child} pathname={pathname} />
          ))}
        </ul>
      </li>
    )
  }
  const active = pathname === node.url
  return (
    <li>
      <Link
        to={node.url}
        data-active={active || undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
          active && "bg-accent text-accent-foreground"
        )}
      >
        <span className="truncate">{node.name}</span>
        {(node as { badge?: string }).badge && (
          <span className="ml-auto rounded-full bg-primary px-1.5 text-[0.625rem] font-medium text-primary-foreground">
            {(node as { badge?: string }).badge}
          </span>
        )}
      </Link>
    </li>
  )
}

export function DocsSidebar({ tree }: { tree: PageTree.Root }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 md:block lg:w-64">
      <ScrollArea className="h-full">
        <nav aria-label="Docs" className="py-8 pr-4">
          <ul className="flex flex-col gap-px">
            {tree.children.map((node, i) => (
              <Node key={nodeKey(node, i)} node={node} pathname={pathname} />
            ))}
          </ul>
        </nav>
      </ScrollArea>
    </aside>
  )
}
