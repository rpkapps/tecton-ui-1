import * as React from "react"
import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeftIcon, ArrowRightIcon, ExternalLinkIcon } from "lucide-react"

import { LinkButton } from "@tecton/react/components/button"

import { DocsToc } from "@/components/docs-toc"
import { getMDXComponents } from "@/components/mdx"
import { docs } from "@/lib/docs"
import { getDocsPage } from "@/lib/page-tree"
import { siteConfig } from "@/lib/site"

export const Route = createFileRoute("/_site/docs/$")({
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/").filter(Boolean) ?? []
    const data = await getDocsPage({ data: slugs })
    if (!data) throw notFound()
    // async collection: fetch the code-split MDX body so it renders synchronously (also on SSR)
    await docs.getPage(data.path)?.preload()
    return data
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} – ${siteConfig.name}` },
          { name: "description", content: loaderData.description ?? "" },
        ]
      : [],
  }),
  component: DocsPage,
})

function DocsPage() {
  const data = Route.useLoaderData()

  return (
    <React.Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Loading…</div>}>
      <Content
        key={data.path}
        path={data.path}
        links={data.links}
        previous={data.previous}
        next={data.next}
      />
    </React.Suspense>
  )
}

function Content({
  path,
  links,
  previous,
  next,
}: {
  path: string
  links?: { doc?: string; api?: string }
  previous: { title: string; url: string } | null
  next: { title: string; url: string } | null
}) {
  const page = docs.getPage(path)
  if (!page) throw new Error(`unknown page: ${path}`)
  const { toc } = React.use(page.load())
  const MDX = page.body

  return (
    <div className="flex w-full items-start gap-10">
      <article className="prose min-w-0 flex-1 py-8 md:py-10">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-medium tracking-tight">{page.title}</h1>
          {page.description && (
            <p className="text-base text-muted-foreground">{page.description}</p>
          )}
          {(links?.doc || links?.api) && (
            <div className="flex items-center gap-2 pt-1">
              {links.doc && (
                <LinkButton
                  variant="secondary"
                  size="xs"
                  href={links.doc}
                  target="_blank"
                  rel="noreferrer"
                >
                  Docs <ExternalLinkIcon data-icon="inline-end" />
                </LinkButton>
              )}
              {links.api && (
                <LinkButton
                  variant="secondary"
                  size="xs"
                  href={links.api}
                  target="_blank"
                  rel="noreferrer"
                >
                  API Reference <ExternalLinkIcon data-icon="inline-end" />
                </LinkButton>
              )}
            </div>
          )}
        </div>
        <MDX components={getMDXComponents()} />
        <nav className="mt-16 flex items-center justify-between gap-4 border-t pt-6 text-sm">
          {previous ? (
            <Link
              to={previous.url}
              className="inline-flex items-center gap-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4" /> {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={next.url}
              className="inline-flex items-center gap-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              {next.title} <ArrowRightIcon className="size-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
      <DocsToc toc={toc} />
    </div>
  )
}
