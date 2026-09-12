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
  // The prerender crawler fetches every page from a Vite preview server that
  // runs in the same process. Bind it to IPv4 explicitly: with `localhost`,
  // Node's fetch races ::1 against 127.0.0.1 and on Windows the ::1 attempt
  // times out under load while 127.0.0.1 is refused (ETIMEDOUT/ECONNREFUSED).
  preview: { host: "127.0.0.1" },
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
        // Every page renders in one process, so more workers only add
        // contention; retry transient connection errors instead of aborting.
        concurrency: 4,
        retryCount: 3,
        retryDelay: 1000,
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
