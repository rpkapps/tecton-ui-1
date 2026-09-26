import { createFileRoute, notFound } from "@tanstack/react-router"

import { NotFound } from "@/components/not-found"

/**
 * Every URL no other route matches: a 404 inside the site chrome (without
 * this route only the root route matches, which has no header or footer).
 */
export const Route = createFileRoute("/_site/$")({
  loader: () => {
    throw notFound()
  },
  notFoundComponent: NotFound,
})
