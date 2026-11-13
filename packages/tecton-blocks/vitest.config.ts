import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

import { flatModuleAliases } from "../tecton-react/scripts/flat-aliases.ts"

const src = fileURLToPath(
  new URL("../tecton-react/src/", import.meta.url)
).replace(/\\/g, "/")

export default defineConfig({
  resolve: {
    alias: [
      ...flatModuleAliases(src),
      { find: /^@tecton\/react\//, replacement: src },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/__tests__/setup.ts"],
    css: false,
    // Whole pages render in some tests; leave room for a loaded CI runner.
    testTimeout: 20_000,
  },
})
