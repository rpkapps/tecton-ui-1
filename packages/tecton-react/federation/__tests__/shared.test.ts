/// <reference types="node" />
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import defaultShared, { shared } from "../shared.mjs"

const SRC = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src"
)

/** Every bare specifier of `name` (the root or a subpath) the sources import. */
function importsOf(name: string): Set<string> {
  const found = new Set<string>()
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__") walk(full)
      } else if (/\.tsx?$/.test(entry.name)) {
        const source = readFileSync(full, "utf8")
        const pattern = /\bfrom\s+["']([^"']+)["']/g
        for (const match of source.matchAll(pattern)) {
          const specifier = match[1]
          if (specifier === name || specifier.startsWith(`${name}/`)) {
            found.add(specifier)
          }
        }
      }
    }
  }
  walk(SRC)
  return found
}

/** Whether a Module Federation `shared` key matches `specifier`. */
function isShared(specifier: string): boolean {
  return Object.keys(shared).some((key) =>
    key.endsWith("/") ? specifier.startsWith(key) : specifier === key
  )
}

describe("shared", () => {
  it("is frozen, and the default export is the same object", () => {
    expect(Object.isFrozen(shared)).toBe(true)
    expect(defaultShared).toBe(shared)
  })

  it("freezes every policy too, so a consumer cannot turn one into a singleton", () => {
    for (const policy of Object.values(shared)) {
      expect(Object.isFrozen(policy)).toBe(true)
    }
    expect(() => {
      // @ts-expect-error — the declaration types the flag as the literal `false`
      shared.react.singleton = true
    }).toThrow(TypeError)
    expect(shared.react.singleton).toBe(false)
  })

  it("types the keys and the flags as literals", () => {
    const singleton: false = shared.sonner.singleton
    const eager: false = shared.recharts.eager
    expect([singleton, eager]).toEqual([false, false])
  })

  it("declares no singleton, so applications can upgrade one at a time", () => {
    for (const [name, policy] of Object.entries(shared)) {
      expect([name, policy.singleton]).toEqual([name, false])
    }
  })

  it("lists exactly the dependencies a host and a remote have to agree on", () => {
    expect(Object.keys(shared)).toEqual([
      "react",
      "react-dom",
      "sonner",
      "@tecton/react/",
      "@base-ui/react",
      "@base-ui/react/",
      "react-aria-components",
      "recharts",
    ])
  })

  it("shares Tecton's internal libraries, but never as singletons", () => {
    expect(shared["@base-ui/react"]).toEqual({ singleton: false })
    expect(shared["@base-ui/react/"]).toEqual({ singleton: false })
    expect(shared["react-aria-components"]).toEqual({ singleton: false })
  })

  it("covers every specifier the sources import Base UI and React Aria by", () => {
    const specifiers = [
      ...importsOf("@base-ui/react"),
      ...importsOf("react-aria-components"),
    ]
    // The root barrel and at least one subpath are both in use.
    expect(specifiers).toContain("@base-ui/react")
    expect(specifiers.some((s) => s.startsWith("@base-ui/react/"))).toBe(true)
    expect(specifiers.filter((specifier) => !isShared(specifier))).toEqual([])
  })

  it("carries no versions, and marks only recharts as never eager", () => {
    const eager = Object.entries(shared).filter(
      ([, policy]) => "eager" in policy
    )

    expect(eager).toEqual([["recharts", { singleton: false, eager: false }]])
    expect(
      Object.values(shared).every((policy) => !("requiredVersion" in policy))
    ).toBe(true)
  })
})
