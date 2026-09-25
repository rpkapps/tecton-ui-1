import { createFileRoute } from "@tanstack/react-router"

import { DocsPage, docsPageHead, loadDocsPage } from "@/components/docs-page"

// `/docs` has a route of its own, the Introduction: without it the URL is
// matched by the splat route while `to: "/docs"` resolves to the layout, and
// the router warns on every link to it.
export const Route = createFileRoute("/_site/docs/")({
  loader: () => loadDocsPage([]),
  head: docsPageHead,
  component: function DocsIndexPage() {
    return <DocsPage data={Route.useLoaderData()} />
  },
})
