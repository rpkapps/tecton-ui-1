/**
 * `import.meta.glob` is Vite's, and Vitest runs the suite through Vite. The
 * package has no direct `vite` dependency — it arrives under `vitest` — so
 * `/// <reference types="vite/client" />` does not resolve here and `vitest`'s
 * own `import-meta.d.ts` declares only `url`. Declare the one member the
 * barrel test uses; the interface merges with Vitest's.
 */
interface ImportMeta {
  glob: (
    pattern: string,
    options: { eager: true }
  ) => Record<string, Record<string, unknown>>
}
