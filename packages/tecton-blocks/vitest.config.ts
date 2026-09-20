import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@tecton/react": fileURLToPath(
        new URL("../tecton-react/src", import.meta.url)
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/__tests__/setup.ts"],
    css: false,
  },
})
