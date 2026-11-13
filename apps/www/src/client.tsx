import * as React from "react"
import { hydrateRoot } from "react-dom/client"
import { StartClient } from "@tanstack/react-start/client"

import { getComponentSource } from "@/components/component-source"
import { preloadDocsBody } from "@/components/docs-page"
import { loadBlock } from "@/lib/blocks"
import { preloadExample } from "@/lib/examples"
import { preloadMarked, readable } from "@/lib/preload"

/** The code-split modules the server HTML shows (lib/preload.ts). */
const preloaded = readable(
  preloadMarked({
    "docs-page": preloadDocsBody,
    example: preloadExample,
    source: getComponentSource,
    block: loadBlock,
  })
)

/**
 * Hydrates its children once `preloaded` has settled, as `StartClient`
 * waits for the router. The root waits, not the call to `hydrateRoot()`:
 * React listens to the page meanwhile, and replays the focus moves and
 * hovers it saw once the page has hydrated.
 */
function Preloaded({ children }: { children: React.ReactNode }) {
  React.use(preloaded)
  return children
}

// TanStack Start's default client entry, with the root in `Preloaded`.
React.startTransition(() => {
  hydrateRoot(
    document,
    <React.StrictMode>
      <Preloaded>
        <StartClient />
      </Preloaded>
    </React.StrictMode>
  )
})
