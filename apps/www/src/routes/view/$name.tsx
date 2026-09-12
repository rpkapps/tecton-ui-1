import * as React from "react"
import { createFileRoute, notFound } from "@tanstack/react-router"

import { Spinner } from "@tecton/react/components/spinner"

import { getBlock, loadBlock } from "@/lib/blocks"

/** Chrome-less block render, used by the block viewer iframes and screenshots. */
export const Route = createFileRoute("/view/$name")({
  loader: ({ params }) => {
    const block = getBlock(params.name)
    if (!block) throw notFound()
    return { name: block.name, title: block.title }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: loaderData.title }] : [],
  }),
  component: ViewPage,
})

function Block({ name }: { name: string }) {
  const Component = React.use(loadBlock(name))
  return <Component />
}

function ViewPage() {
  const { name } = Route.useLoaderData()
  return (
    <div className="min-h-svh bg-background text-foreground">
      <React.Suspense
        fallback={
          <div className="flex h-svh items-center justify-center">
            <Spinner className="text-muted-foreground" />
          </div>
        }
      >
        <Block name={name} />
      </React.Suspense>
    </div>
  )
}
