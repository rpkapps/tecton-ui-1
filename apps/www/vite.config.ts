import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fumadocsMdx } from "fumadocs-mdx/vite"

const blockNames = readdirSync(
  fileURLToPath(new URL("../../packages/tecton-react/src/blocks", import.meta.url)),
  { withFileTypes: true }
)
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const config = defineConfig({
  server: { port: 3000 },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    // Must run before tanstackStart/react so .mdx and `fumadocs-mdx/macro` calls are transformed first.
    fumadocsMdx({ index: false }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        // Example previews contain demo links (breadcrumbs, pagination…) that
        // point nowhere; only crawl the site's own sections.
        filter: (page) => {
          if (page.path === "/") return true
          const view = page.path.match(/^\/view\/([^/]+)$/)
          if (view) return blockNames.includes(view[1])
          return /^\/(docs|blocks|themes|compare)(\/|$)/.test(page.path)
        },
      },
    }),
    viteReact(),
  ],
})

export default config
