import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig, type Plugin } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fumadocsMdx } from "fumadocs-mdx/vite"

const blockNames = readdirSync(
  fileURLToPath(
    new URL("../../packages/tecton-blocks/src/blocks", import.meta.url)
  ),
  { withFileTypes: true }
)
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

// Forward slashes: the replacement is concatenated with the rest of the request,
// and a mixed `C:\…\src\styles/globals.css` is not a path Vite normalises.
const tectonSrc = fileURLToPath(
  new URL("../../packages/tecton-react/src/", import.meta.url)
).replace(/\\/g, "/")

// Every `lucide-react` import in this site — the synced examples, the blocks —
// renders a Tecton glyph instead, by resolving to the compat module documented
// at the top of packages/tecton-react/src/icons/lucide-compat.ts. The generated
// components no longer need it (the registry writes the compat import into them
// directly); this is the alias an *application* adds for its own code, and the
// docs site is that application.
//
// It cannot be a plain `resolve.alias`: the compat module's own map ends with
// `export * from "lucide-react"`, so aliasing that import too would resolve the
// module to itself. Hence a `pre` plugin that skips importers inside the
// package's icons folder — `src/icons/` when the dev aliases point at the
// sources, `dist/icons/` when the build resolves the published `exports` map.
const tectonIconsDir = /[\\/](?:tecton-react|@tecton[\\/]react)[\\/](?:src|dist)[\\/]icons[\\/]/

function tectonLucideCompat(): Plugin {
  return {
    name: "tecton-lucide-compat",
    enforce: "pre",
    async resolveId(source, importer) {
      if (source !== "lucide-react" || !importer) return null
      if (tectonIconsDir.test(importer)) return null
      const resolved = await this.resolve(
        "@tecton/react/icons/lucide-compat",
        importer,
        { skipSelf: true }
      )
      return resolved?.id ?? null
    },
  }
}

// `@tecton/react` resolves through its `exports` map, which points at the built
// `dist/`. That is what `vite build` (and `tsc`) must see, so the docs site
// validates the published surface. For `vite dev` there is nothing to rebuild on
// every edit: alias the package back onto its sources. The order matters —
// `globals.css` and `styles/` sit under `src/styles/`, everything else under
// `src/`.
const devAliases = [
  {
    find: /^@tecton\/react\/globals\.css$/,
    replacement: `${tectonSrc}styles/globals.css`,
  },
  { find: /^@tecton\/react\/styles\//, replacement: `${tectonSrc}styles/` },
  { find: /^@tecton\/react\//, replacement: tectonSrc },
]

const config = defineConfig(({ command }) => ({
  // PORT lets a harness or a second checkout run the dev server off 3000.
  server: { port: Number(process.env.PORT) || 3000 },
  // The prerender crawler fetches every page from a Vite preview server that
  // runs in the same process. Bind it to IPv4 explicitly: with `localhost`,
  // Node's fetch races ::1 against 127.0.0.1 and on Windows the ::1 attempt
  // times out under load while 127.0.0.1 is refused (ETIMEDOUT/ECONNREFUSED).
  preview: { host: "127.0.0.1" },
  resolve: {
    tsconfigPaths: true,
    alias: [
      ...(command === "serve" ? devAliases : []),
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  plugins: [
    tectonLucideCompat(),
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
}))

export default config
