import { describe, expect, it } from "vitest"

import defaultShared, { shared } from "../shared.mjs"

describe("shared", () => {
  it("is frozen, and the default export is the same object", () => {
    expect(Object.isFrozen(shared)).toBe(true)
    expect(defaultShared).toBe(shared)
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
