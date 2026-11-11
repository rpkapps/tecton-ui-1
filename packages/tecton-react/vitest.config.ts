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
          exclude: ["src/**/__tests__/**/*-perf.test.ts"],
          setupFiles: ["./src/tecton/__tests__/setup.ts"],
        },
      },
      {
        // Performance budgets time the engine, so they run alone: after
        // every other project has finished (a higher group order), one
        // file at a time, rather than beside a hundred other test files.
        extends: true,
        test: {
          name: "perf",
          environment: "jsdom",
          include: ["src/**/__tests__/**/*-perf.test.ts"],
          setupFiles: ["./src/tecton/__tests__/setup.ts"],
          fileParallelism: false,
          sequence: { groupOrder: 1 },
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
