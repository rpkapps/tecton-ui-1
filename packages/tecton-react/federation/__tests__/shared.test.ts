import { describe, expect, it } from "vitest"

import defaultShared, { shared } from "../shared.mjs"

describe("shared", () => {
  it("is frozen, and the default export is the same object", () => {
    expect(Object.isFrozen(shared)).toBe(true)
    expect(defaultShared).toBe(shared)
  })

  it("freezes every policy too, so a consumer cannot flip a singleton", () => {
    for (const policy of Object.values(shared)) {
      expect(Object.isFrozen(policy)).toBe(true)
    }
    expect(() => {
      // @ts-expect-error — the declaration types the flag as the literal `true`
      shared.react.singleton = false
    }).toThrow(TypeError)
    expect(shared.react.singleton).toBe(true)
  })

  it("types the keys and the flags as literals", () => {
    const singleton: true = shared.react.singleton
    const eager: false = shared.recharts.eager
    expect([singleton, eager]).toEqual([true, false])
  })

  it("lists exactly the dependencies a host and a remote have to agree on", () => {
    expect(Object.keys(shared)).toEqual([
      "react",
      "react-dom",
      "sonner",
      "@tecton/react/",
      "react-aria-components",
      "recharts",
    ])
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
