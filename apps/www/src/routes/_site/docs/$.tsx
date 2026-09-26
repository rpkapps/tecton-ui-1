import { createFileRoute } from "@tanstack/react-router"

import { DocsPage, docsPageHead, loadDocsPage } from "@/components/docs-page"

export const Route = createFileRoute("/_site/docs/$")({
  loader: ({ params }) =>
    loadDocsPage(params._splat?.split("/").filter(Boolean) ?? []),
  head: docsPageHead,
  component: function DocsSplatPage() {
    return <DocsPage data={Route.useLoaderData()} />
  },
})
