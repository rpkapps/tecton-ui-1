import { defineConfig, defineDocs } from "fumadocs-mdx/config"
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins/rehype-code"
import { pageSchema } from "fumadocs-core/source/schema"
import { z } from "zod"

/**
 * The docs collection. `fumadocs-mdx` generates `.source/server.ts` (frontmatter
 * and page tree, imported by server functions only) and `.source/browser.ts`
 * (the code-split MDX bodies the client renders) from it.
 */
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    // Only frontmatter is loaded eagerly on the server; bodies stay lazy.
    async: true,
    // `links` feeds the Docs / API Reference buttons of a page (TanStack,
    // Embla…). The default schema strips unknown keys, so it is declared.
    schema: pageSchema.extend({
      links: z
        .object({
          doc: z.url().optional(),
          api: z.url().optional(),
        })
        .optional(),
    }),
  },
})

/** The lines of a `{1,4-6}` range in a fence's meta string. */
function highlightedLines(meta: string) {
  const lines = new Set<number>()
  const range = /\{([\d\s,-]+)\}/.exec(meta)?.[1]
  for (const part of range?.split(",") ?? []) {
    const [start, end = start] = part.split("-").map((n) => Number(n.trim()))
    for (let line = start; line <= end; line++) lines.add(line)
  }
  return lines
}

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      defaultColor: false,
      // The fence's language is rendered as an icon by the MDX `pre`
      // component (like <CodeBlock />), not as fumadocs' inline SVG string.
      icon: false,
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        {
          // Same markup as `highlightCode` (lib/highlight.ts), so MDX fences
          // and <CodeBlock /> share the docs stylesheet and the `pre`
          // component can read the language. Highlighted lines — a
          // `{1,4-6}` range in the fence meta or a `// [!code highlight]`
          // comment — get `data-highlighted-line`.
          name: "tecton-docs:data-attributes",
          pre(node) {
            node.properties["data-language"] = this.options.lang
          },
          code(node) {
            node.properties["data-language"] = this.options.lang
            for (const line of node.children) {
              if (line.type !== "element") continue
              const className = line.properties.className
              if (Array.isArray(className) && className.includes("highlighted"))
                line.properties["data-highlighted-line"] = ""
            }
          },
          line(node, lineNumber) {
            node.properties["data-line"] = ""
            const meta = this.options.meta?.__raw
            if (meta && highlightedLines(meta).has(lineNumber))
              node.properties["data-highlighted-line"] = ""
          },
        },
      ],
    },
  },
})
