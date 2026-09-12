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
import { siteConfig } from "@/lib/site"

export const Route = createFileRoute("/_site/blocks/")({
  head: () => ({ meta: [{ title: `Blocks – ${siteConfig.name}` }] }),
  component: BlocksIndex,
})

function useHash() {
  const [hash, setHash] = React.useState("")
  React.useEffect(() => {
    const update = () => setHash(window.location.hash.slice(1))
    update()
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  return hash
}

function BlocksNav() {
  const hash = useHash()
  return (
    <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 py-2">
      {blockCategories.map((category) => (
        <a
          key={category.id}
          href={`#${category.id}`}
          data-active={hash === category.id}
          className="flex h-7 shrink-0 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground"
        >
          {category.title}
        </a>
      ))}
    </nav>
  )
}

function BlocksIndex() {
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
        <BlocksNav />
      </div>

      <div className="flex flex-col gap-16 py-8 md:gap-24 md:py-10">
        {blockCategories.map((category) => {
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
