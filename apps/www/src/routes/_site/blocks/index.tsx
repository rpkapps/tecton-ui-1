import { createFileRoute, Link } from "@tanstack/react-router"

import { PageHeader, PageHeaderContent, PageHeaderDescription, PageHeaderTitle } from "@tecton/react/tecton/page-header"

import { BlockViewer } from "@/components/block-viewer"
import { blockCategories, blocks } from "@/lib/blocks"
import { siteConfig } from "@/lib/site"

export const Route = createFileRoute("/_site/blocks/")({
  head: () => ({ meta: [{ title: `Blocks – ${siteConfig.name}` }] }),
  component: BlocksIndex,
})

function BlocksIndex() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Blocks</PageHeaderTitle>
          <PageHeaderDescription>
            Reusable application patterns built from Tecton components: panels,
            comparison tables, KPI cards and full page layouts. Open a block to
            see it full-screen and copy its source.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>
      <nav className="flex flex-wrap gap-2 text-sm">
        {blockCategories.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className="rounded-full border px-3 py-1 text-muted-foreground hover:text-foreground"
          >
            {category.title}
          </a>
        ))}
      </nav>
      {blockCategories.map((category) => {
        const items = blocks.filter((block) => block.category === category.id)
        if (!items.length) return null
        return (
          <section key={category.id} id={category.id} className="flex scroll-mt-20 flex-col gap-6">
            <h2 className="text-lg font-medium">{category.title}</h2>
            {items.map((block) => (
              <BlockViewer key={block.name} block={block} compact>
                <Link
                  to="/blocks/$name"
                  params={{ name: block.name }}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  Open
                </Link>
              </BlockViewer>
            ))}
          </section>
        )
      })}
    </div>
  )
}
