import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

import { flatModuleAliases } from "./scripts/flat-aliases.ts"

const src = fileURLToPath(new URL("./src/", import.meta.url)).replace(
  /\\/g,
  "/"
)

export default defineConfig({
  resolve: {
    alias: [
      ...flatModuleAliases(src),
      { find: /^@tecton\/react\//, replacement: src },
    ],
  },
  test: {
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/tecton/**/*.tsx"],
      exclude: ["src/tecton/__tests__/**"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
          setupFiles: ["./src/tecton/__tests__/setup.ts"],
        },
      },
      {
        // What the package ships for a consumer's build — the PostCSS plugin, the
        // federation contract — is Node-only: no DOM, and none of the jsdom shims
        // the component setup file installs. So are the build scripts, which read
        // icons-src/ and src/icons/ off disk.
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: [
            "postcss/__tests__/**/*.test.ts",
            "federation/__tests__/**/*.test.ts",
            "scripts/__tests__/**/*.test.ts",
          ],
        },
      },
    ],
  },
})
