import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"

import { BlockViewer } from "@/components/block-viewer"
import { NotFound } from "@/components/not-found"
import { getBlock } from "@/lib/blocks"
import { siteConfig } from "@/lib/site"

export const Route = createFileRoute("/_site/blocks/$name")({
  loader: ({ params }) => {
    const block = getBlock(params.name)
    if (!block) throw notFound()
    const { component: _component, ...meta } = block
    return meta
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.title} – Blocks – ${siteConfig.name}` }]
      : [],
  }),
  notFoundComponent: NotFound,
  component: BlockPage,
})

function BlockPage() {
  const meta = Route.useLoaderData()
  const block = getBlock(meta.name)!
  return (
    <div className="flex flex-col gap-6 py-8 md:py-10">
      <Link
        to="/blocks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> All blocks
      </Link>
      <BlockViewer block={block} height="calc(100svh - 12rem)" />
    </div>
  )
}
