import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@tecton/react": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/tecton/__tests__/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/tecton/**/*.tsx"],
      exclude: ["src/tecton/__tests__/**"],
    },
  },
})
