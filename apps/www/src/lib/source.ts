import { loader } from "fumadocs-core/source"
import { docs } from "fumadocs-mdx:collections/server"

// Server-only: import inside createServerFn handlers only, so the collection
// (the frontmatter of every page, the fumadocs runtime) never ships to the
// browser. The client renders page bodies from `fumadocs-mdx:collections/browser`.
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
})
