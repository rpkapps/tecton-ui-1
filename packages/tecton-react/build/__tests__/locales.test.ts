/// <reference types="node" />
import { describe, expect, it } from "vitest"

import tectonLocales from "../locales.mjs"

type ResolveId = (
  source: string,
  importer: string,
  options: { ssr?: boolean }
) => Promise<unknown> | unknown

/** The plugin's resolver, as the bundler calls it. */
function resolverOf(plugin: unknown): ResolveId {
  const { resolveId } = plugin as {
    resolveId: ResolveId | { handler: ResolveId }
  }
  return typeof resolveId === "function" ? resolveId : resolveId.handler
}

const DND_STRINGS =
  "/app/node_modules/react-aria/dist/private/intl/dnd/index.mjs"

describe("tectonLocales", () => {
  it("leaves out the strings of the locales an app does not ship", async () => {
    const resolve = resolverOf(tectonLocales.rollup({ locales: ["en-US"] }))
    expect(await resolve.call({}, "./de-DE.mjs", DND_STRINGS, {})).toMatch(
      /empty\.js$/
    )
    expect(await resolve.call({}, "./ar-AE.mjs", DND_STRINGS, {})).toMatch(
      /empty\.js$/
    )
  })

  it("keeps the listed locales, other packages and server builds", async () => {
    const resolve = resolverOf(
      tectonLocales.rollup({ locales: ["en-US", "nb-NO"] })
    )
    expect(await resolve.call({}, "./en-US.mjs", DND_STRINGS, {})).toBeNull()
    expect(await resolve.call({}, "./nb-NO.mjs", DND_STRINGS, {})).toBeNull()
    expect(
      await resolve.call({}, "./de-DE.mjs", DND_STRINGS, { ssr: true })
    ).toBeUndefined()
    expect(
      await resolve.call({}, "./de-DE.js", "/app/node_modules/other/i.js", {})
    ).toBeUndefined()
  })

  it("has a plugin for each bundler", () => {
    const options = { locales: ["en-US"] }
    for (const plugin of [
      tectonLocales.vite(options),
      tectonLocales.rollup(options),
    ]) {
      expect(plugin).toMatchObject({ name: "locales-plugin" })
    }
    expect(typeof tectonLocales.webpack(options)).toBe("object")
    expect(typeof tectonLocales.esbuild(options)).toBe("object")
    expect(tectonLocales.turbopack(options)).toHaveProperty("rules")
  })
})
