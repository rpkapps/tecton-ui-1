/**
 * The code-split modules a server-rendered page shows, loaded before it
 * hydrates.
 *
 * A docs page's MDX body, its examples and sources and a block are loaded on
 * demand: the server renders them from modules it has loaded, the browser
 * loads each one when a component asks for it, suspending its Suspense
 * boundary meanwhile. A boundary that suspends while React hydrates keeps its
 * server HTML only until something above it updates outside a transition, and
 * the router and the sidebar do right after the hydration commit: React then
 * renders the boundary again on the client, deleting its server HTML and
 * showing its fallback until the module has loaded (the page blanks, a field
 * focused meanwhile loses focus).
 *
 * So nothing may suspend while the page hydrates. A component that suspends
 * on such a module marks its server-rendered element with
 * `preloadMarker(kind, key)`, and the client entry (`client.tsx`) hydrates
 * once `preloadMarked()` has loaded every module marked in the document into
 * the cache its component reads, where `use()` finds it settled
 * (`readable()`).
 */
export type PreloadKind = "docs-page" | "example" | "source" | "block"

/** Props for the element that marks a module the server HTML was rendered with. */
export function preloadMarker(kind: PreloadKind, key: string) {
  return { "data-preload": `${kind}:${key}` }
}

/**
 * Loads every module marked in the document with its kind's preloader. It
 * never rejects: what fails to load suspends during hydration as before.
 */
export async function preloadMarked(
  preloaders: Record<PreloadKind, (key: string) => Promise<unknown>>
) {
  const marked = new Set<string>()
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-preload]"
  )) {
    if (element.dataset.preload) marked.add(element.dataset.preload)
  }
  await Promise.allSettled(
    Array.from(marked, async (marker) => {
      const colon = marker.indexOf(":")
      const kind = marker.slice(0, colon) as PreloadKind
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- a kind read from the HTML
      await preloaders[kind]?.(marker.slice(colon + 1))
    })
  )
}

type Readable<T> = Promise<T> & {
  status?: "fulfilled" | "rejected"
  value?: T
  reason?: unknown
}

/**
 * `promise` with the fields React's `use()` reads synchronously, set as it
 * settles: `use()` returns its value without suspending from then on, also
 * the first time it reads it (a promise it has not seen before suspends once
 * even when it has already resolved).
 */
export function readable<T>(promise: Promise<T>): Promise<T> {
  const result = promise as Readable<T>
  promise.then(
    (value) => {
      result.status = "fulfilled"
      result.value = value
    },
    (reason: unknown) => {
      result.status = "rejected"
      result.reason = reason
    }
  )
  return result
}
