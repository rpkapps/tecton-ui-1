import { createServerFn } from "@tanstack/react-start"

export type SearchEntry = {
  title: string
  description?: string
  url: string
  section: string
}

// Flattens the docs page tree (server only) into a small index for the
// command menu. Blocks and top-level pages are appended by the client.
export const getSearchIndex = createServerFn({ method: "GET" }).handler(
  async (): Promise<SearchEntry[]> => {
    const { source } = await import("./source")
    const entries: SearchEntry[] = []
    for (const page of source.getPages()) {
      const [first] = page.slugs
      const section =
        first === "components"
          ? "Components"
          : first === "tecton"
            ? "Tecton components"
            : "Docs"
      entries.push({
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        section,
      })
    }
    return entries
  }
)
