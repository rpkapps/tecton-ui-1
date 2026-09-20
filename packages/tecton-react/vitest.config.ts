import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@tecton/react": fileURLToPath(new URL("./src", import.meta.url)),
    },
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
        // The PostCSS plugin is Node-only: no DOM, and none of the jsdom shims the
        // component setup file installs.
        extends: true,
        test: {
          name: "postcss",
          environment: "node",
          include: ["postcss/__tests__/**/*.test.ts"],
        },
      },
    ],
  },
})
