import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"

import { LinkButton } from "@tecton/react/components/button"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

import { BlockViewer } from "@/components/block-viewer"
import { blockCategories, blocks } from "@/lib/blocks"
import type { BlockCategory } from "@/lib/blocks"
import { siteConfig } from "@/lib/site"

export const Route = createFileRoute("/_site/blocks/")({
  head: () => ({ meta: [{ title: `Blocks – ${siteConfig.name}` }] }),
  component: BlocksIndex,
})

type Filter = BlockCategory | "all"

function BlocksNav({
  value,
  onChange,
}: {
  value: Filter
  onChange: (next: Filter) => void
}) {
  const options: { id: Filter; title: string }[] = [
    { id: "all", title: "All" },
    ...blockCategories,
  ]
  return (
    <nav
      aria-label="Filter blocks"
      className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 py-2"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className="flex h-7 shrink-0 cursor-pointer items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
        >
          {option.title}
        </button>
      ))}
    </nav>
  )
}

function BlocksIndex() {
  const [filter, setFilter] = React.useState<Filter>("all")
  const visible = blockCategories.filter(
    (category) => filter === "all" || category.id === filter
  )
  return (
    <div className="flex flex-col">
      <PageHeader className="py-8 md:py-10">
        <PageHeaderContent>
          <PageHeaderTitle>Building blocks for Tecton apps</PageHeaderTitle>
          <PageHeaderDescription>
            Reusable application patterns built from Tecton components: panels,
            comparison tables, KPI cards and full page layouts. Preview a block
            at any width, read its source and install it with one command.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <LinkButton href="#blocks" size="sm">
            Browse blocks
          </LinkButton>
          <LinkButton href="/docs/cli" variant="ghost" size="sm">
            Using the CLI
          </LinkButton>
        </PageHeaderActions>
      </PageHeader>

      <div
        id="blocks"
        className="sticky top-(--header-height) z-30 -mx-6 scroll-mt-24 border-y bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <BlocksNav value={filter} onChange={setFilter} />
      </div>

      <div className="flex flex-col gap-16 py-8 md:gap-24 md:py-10">
        {visible.map((category) => {
          const items = blocks.filter((block) => block.category === category.id)
          if (!items.length) return null
          return (
            <section
              key={category.id}
              id={category.id}
              className="flex scroll-mt-28 flex-col gap-10 md:gap-16"
            >
              <h2 className="sr-only">{category.title}</h2>
              {items.map((block) => (
                <BlockViewer key={block.name} block={block} />
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
