import * as React from "react"
import { createFileRoute, notFound } from "@tanstack/react-router"

import { Spinner } from "@tecton/react/components/spinner"

import { compareMatrices } from "@/compare/matrices"

/**
 * Chrome-less state matrices used for the screenshot comparison against the
 * Tecton Storybook captures (tecton-screenshots/). Rendered dark by default;
 * `?theme=light` switches.
 */
export const Route = createFileRoute("/compare/$component")({
  validateSearch: (search: Record<string, unknown>) => ({
    theme: search.theme === "light" ? ("light" as const) : ("dark" as const),
  }),
  loader: ({ params }) => {
    const matrix = compareMatrices[params.component]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- route param
    if (!matrix) throw notFound()
    return { component: params.component, title: matrix.title, reference: matrix.reference }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `Compare – ${loaderData.title}` }] : [],
  }),
  component: ComparePage,
})

function ComparePage() {
  const { component, title, reference } = Route.useLoaderData()
  const { theme } = Route.useSearch()
  const matrix = compareMatrices[component]
  const Matrix = React.useMemo(() => React.lazy(matrix.load), [matrix])

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.classList.toggle("light", theme === "light")
  }, [theme])

  return (
    <div
      data-compare={component}
      className="min-h-svh bg-background p-8 text-foreground"
    >
      <div className="mb-6 flex items-baseline justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{title}</span>
        <span className="font-mono">{reference}</span>
      </div>
      <React.Suspense fallback={<Spinner />}>
        <Matrix />
      </React.Suspense>
    </div>
  )
}
