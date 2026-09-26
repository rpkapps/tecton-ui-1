import { describe, expect, it } from "vitest"

import defaultShared, { shared } from "../shared.mjs"

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
      "@base-ui/react/",
      "react-aria-components",
      "recharts",
    ])
  })

  it("shares Tecton's internal libraries, but never as singletons", () => {
    expect(shared["@base-ui/react/"]).toEqual({ singleton: false })
    expect(shared["react-aria-components"]).toEqual({ singleton: false })
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
