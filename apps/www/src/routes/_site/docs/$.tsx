import { createFileRoute } from "@tanstack/react-router"

import { DocsPage, docsPageHead, loadDocsPage } from "@/components/docs-page"
import { NotFound } from "@/components/not-found"

export const Route = createFileRoute("/_site/docs/$")({
  loader: ({ params }) =>
    loadDocsPage(params._splat?.split("/").filter(Boolean) ?? []),
  head: docsPageHead,
  // Rendered in place of the page, inside the docs layout (sidebar and all).
  notFoundComponent: NotFound,
  component: function DocsSplatPage() {
    return <DocsPage data={Route.useLoaderData()} />
  },
})
