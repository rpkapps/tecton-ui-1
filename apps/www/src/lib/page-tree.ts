import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

// Serialized page tree for the docs sidebar (deserialized on the client with
// `useFumadocsLoader`).
export const getPageTree = createServerFn({ method: "GET" }).handler(
  async () => {
    const { source } = await import("./source")
    return {
      pageTree: await source.serializePageTree(source.getPageTree()),
    }
  }
)

/** The slugs of a docs URL (`/docs/components/button` → `["components", "button"]`). */
const docsPageInput = z.array(z.string().max(128)).max(16)

export const getDocsPage = createServerFn({ method: "GET" })
  .validator(docsPageInput)
  .handler(async ({ data: slugs }) => {
    const { source } = await import("./source")
    const page = source.getPage(slugs)
    if (!page) {
      return null
    }
    // Neighbours in sidebar order (meta.json), not in file-system order.
    const { findNeighbour } = await import("fumadocs-core/page-tree")
    const neighbours = findNeighbour(source.getPageTree(), page.url)
    const pick = (item: { url: string } | undefined) => {
      const neighbour =
        item && source.getPages().find((p) => p.url === item.url)
      return neighbour
        ? { title: neighbour.data.title, url: neighbour.url }
        : null
    }
    return {
      path: page.path,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      links: page.data.links,
      previous: pick(neighbours.previous),
      next: pick(neighbours.next),
    }
  })
