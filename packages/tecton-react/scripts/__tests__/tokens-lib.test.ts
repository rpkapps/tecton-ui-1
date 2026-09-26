// @vitest-environment jsdom
// (the selector tests below need a DOM to match against)
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import type { JsonSchema, TokenMap } from "../tokens-lib.mjs"
import {
  SCOPED_DARK,
  SCOPED_LIGHT,
  SCOPED_ROOT,
  blockDecls,
  blockDrift,
  compositeOver,
  expectedBlocks,
  findBlock,
  isStaleThemeEntry,
  parseThemedTokens,
  parseTokenMap,
  patchBlock,
  readsTectonToken,
  resolveTokenMap,
  resolveValue,
  validateAgainstSchema,
} from "../tokens-lib.mjs"

const pkgRoot = path.dirname(
  path.dirname(path.dirname(fileURLToPath(import.meta.url)))
)
const SCHEMA = JSON.parse(
  readFileSync(path.join(pkgRoot, "tokens/tecton.map.schema.json"), "utf8")
) as JsonSchema

const TOKENS = `:root {
  --tecton-bg: #ffffff;
  --tecton-text: #111111;
  --tecton-radius: 0.5rem;
  --tecton-gap: 4px;
}
.dark {
  --tecton-bg: #000000;
  --tecton-text: #eeeeee;
}
`

const MAP: TokenMap = {
  version: 2,
  shadcn: {
    background: { dark: "--tecton-bg", confidence: "exact" },
    foreground: { dark: "--tecton-text", confidence: "exact" },
    radius: { dark: "--tecton-radius", confidence: "exact" },
  },
  extra: {
    surface: { dark: "--tecton-bg", confidence: "approximated" },
    gap: { dark: "--tecton-gap", confidence: "exact" },
  },
  theme: { "--radius-md": "var(--tecton-radius)" },
  light: { strategy: "tecton-light-tokens" },
}

describe("resolveValue", () => {
  const tokens = new Map([
    ["--a", "var(--b)"],
    ["--b", "#fff"],
  ])

  it("follows references and falls back when one is unknown", () => {
    expect(resolveValue("var(--a)", tokens)).toBe("#fff")
    expect(resolveValue("var(--missing, red)", tokens)).toBe("red")
    expect(resolveValue("1px solid var(--a)", tokens)).toBe("1px solid #fff")
  })

  it("parses nested fallbacks to their matching parenthesis", () => {
    expect(resolveValue("var(--x, var(--y, var(--a)))", tokens)).toBe("#fff")
    expect(resolveValue("var(--x, rgb(0 0 0 / 50%))", tokens)).toBe(
      "rgb(0 0 0 / 50%)"
    )
    expect(
      resolveValue("var(--x, var(--y, Figtree, sans-serif)), serif", tokens)
    ).toBe("Figtree, sans-serif, serif")
    // the regex this replaces cut the fallback at the first `)`
    expect(resolveValue("calc(var(--x, 1px) * 2)", tokens)).toBe(
      "calc(1px * 2)"
    )
  })

  it("throws on a dangling reference, and on a runaway chain", () => {
    expect(() => resolveValue("var(--missing)", tokens)).toThrow(
      /Dangling var\(--missing\)/
    )
    const loop = new Map([["--loop", "var(--loop)"]])
    expect(() => resolveValue("var(--loop)", loop)).toThrow(/too deep/)
  })
})

describe("validateAgainstSchema", () => {
  it("accepts the committed map", () => {
    const map = readFileSync(
      path.join(pkgRoot, "tokens/tecton.map.json"),
      "utf8"
    )
    expect(validateAgainstSchema(JSON.parse(map), SCHEMA)).toEqual([])
    expect(() => parseTokenMap(map, SCHEMA)).not.toThrow()
  })

  it("reports missing keys, bad enums, patterns and types", () => {
    const bad = {
      version: "2",
      shadcn: {
        primary: { dark: "--primary-bg", confidence: "guessed" },
        ring: { confidence: "exact" },
      },
      extra: {},
      theme: { "--radius-md": 4 },
    }
    expect(validateAgainstSchema(bad, SCHEMA)).toEqual([
      '$: missing required "light"',
      "$.version: expected integer, got string",
      '$.shadcn.primary.dark: "--primary-bg" does not match /^--tecton-/',
      '$.shadcn.primary.confidence: "guessed" is not one of "exact", "approximated", "derived"',
      '$.shadcn.ring: missing required "dark"',
      "$.theme.--radius-md: expected string, got number",
    ])
    expect(() => parseTokenMap(JSON.stringify(bad), SCHEMA)).toThrow(
      /does not match its schema/
    )
  })

  it("refuses a schema keyword it does not implement", () => {
    expect(() =>
      validateAgainstSchema("x", { type: "string", minLength: 2 } as never)
    ).toThrow(/unsupported keyword "minLength"/)
  })
})

describe("resolveTokenMap", () => {
  const resolved = resolveTokenMap(MAP, parseThemedTokens(TOKENS))

  it("keeps a non-colour extra out of .dark and out of the --color-* entries", () => {
    const blocks = expectedBlocks(resolved)

    expect([...blocks.root.keys()]).toEqual([
      "--background",
      "--foreground",
      "--radius",
      "--surface",
      "--gap",
    ])
    expect([...blocks.dark.keys()]).toEqual([
      "--background",
      "--foreground",
      "--surface",
    ])
    expect([...blocks.theme]).toEqual([
      ["--radius-md", "var(--tecton-radius)"],
      ["--color-surface", "var(--surface)"],
    ])
    expect([...blocks.dark.values()]).not.toContain("undefined")
  })
})

describe("patchBlock", () => {
  const css = `:root {
    --background: var(--tecton-old);
    --removed: var(--tecton-gone); /* was an extra */
    --cli-owned: 1rem;
}
`

  it("updates values, appends what is missing, and prunes what the map dropped", () => {
    const block = findBlock(css, ":root")!
    const { css: out, pruned } = patchBlock(
      css,
      block,
      new Map([
        ["--background", "var(--tecton-bg)"],
        ["--surface", "var(--tecton-bg)"],
      ]),
      ["--surface"],
      (_, value) => readsTectonToken(value)
    )

    expect(pruned).toEqual(["--removed"])
    expect(out).toBe(`:root {
    --background: var(--tecton-bg);
    --cli-owned: 1rem;
    --surface: var(--tecton-bg);
}
`)
  })

  it("refuses to append a variable it has no value for", () => {
    expect(() =>
      patchBlock(css, findBlock(css, ":root")!, new Map(), ["--gap"])
    ).toThrow(/no value to append for --gap/)
  })
})

describe("blockDrift", () => {
  const globals = `:root {
  --background: var(--tecton-bg);
  --primary: #ff00ff;
  --stale: var(--tecton-gone);
  --cli: 1rem;
}`

  it("reports a hand-edited value, a missing entry and a stale one", () => {
    const expected = new Map([
      ["--background", "var(--tecton-bg)"],
      ["--primary", "var(--tecton-action)"],
      ["--ring", "var(--tecton-focus)"],
    ])
    expect(
      blockDrift(blockDecls(globals, ":root")!, expected, (_, value) =>
        readsTectonToken(value)
      )
    ).toEqual([
      {
        name: "--primary",
        problem: "value",
        got: "#ff00ff",
        want: "var(--tecton-action)",
      },
      { name: "--ring", problem: "missing", want: "var(--tecton-focus)" },
      { name: "--stale", problem: "stale", got: "var(--tecton-gone)" },
    ])
  })
})

describe("isStaleThemeEntry", () => {
  const root = new Set(["--sidebar", "--surface"])

  it("flags an entry that reads a raw token or names a dropped extra", () => {
    expect(
      isStaleThemeEntry("--radius-xs", "var(--tecton-radius-10)", root)
    ).toBe(true)
    expect(isStaleThemeEntry("--color-gone", "var(--gone)", root)).toBe(true)
  })

  it("keeps the CLI's entries and anything that is not a bare reference", () => {
    expect(isStaleThemeEntry("--color-sidebar", "var(--sidebar)", root)).toBe(
      false
    )
    expect(isStaleThemeEntry("--font-heading", "var(--font-sans)", root)).toBe(
      false
    )
    expect(
      isStaleThemeEntry("--radius-3xl", "calc(var(--radius) * 2.2)", root)
    ).toBe(false)
  })
})

describe("compositeOver", () => {
  it("composites a translucent colour over what is under it", () => {
    const white = compositeOver("#ffffff")!
    const half = compositeOver("rgb(0 0 0 / 0.5)", white)!
    expect(half.r).toBeCloseTo(0.5)
    // a translucent foreground on a translucent surface: the surface is
    // composited over the page first, then the text over that result
    const text = compositeOver("rgb(0 0 0 / 0.5)", half)!
    expect(text.r).toBeCloseTo(0.25)
    expect(compositeOver("not a colour")).toBeUndefined()
  })
})

describe("the scoped theme selectors", () => {
  /** Which block a root reads: the last of the three it matches (all weigh the same). */
  function modeOf(markup: string) {
    document.body.innerHTML = markup
    const root = document.querySelector(SCOPED_ROOT)!
    let mode = "light"
    if (root.matches(SCOPED_DARK)) mode = "dark"
    if (root.matches(SCOPED_LIGHT)) mode = "light"
    return mode
  }
  const R = '<div data-tecton-root=""></div>'

  it("follows the marker on the root and the nearest one above it", () => {
    expect(modeOf(R)).toBe("light")
    expect(modeOf(`<div class="dark">${R}</div>`)).toBe("dark")
    expect(
      modeOf(
        `<div class="dark"><div data-tecton-root class="light"></div></div>`
      )
    ).toBe("light")
    expect(
      modeOf(
        `<div data-theme="dark"><div data-tecton-root data-theme="light"></div></div>`
      )
    ).toBe("light")
  })

  it("reads light inside a light island of a dark page", () => {
    expect(
      modeOf(`<div class="dark"><div class="light">${R}</div></div>`)
    ).toBe("light")
    expect(
      modeOf(
        `<div data-theme="dark"><section data-theme="light"><div>${R}</div></section></div>`
      )
    ).toBe("light")
  })

  it("keeps an explicitly dark root, and a dark island inside the light one, dark", () => {
    expect(
      modeOf(
        `<div class="dark"><div class="light"><div data-tecton-root class="dark"></div></div></div>`
      )
    ).toBe("dark")
    expect(
      modeOf(
        `<div class="dark"><div class="light"><div class="dark">${R}</div></div></div>`
      )
    ).toBe("dark")
  })

  it("reads light in a light island of a dark island of an explicitly light page", () => {
    expect(
      modeOf(
        `<div class="light"><div class="dark"><div class="light">${R}</div></div></div>`
      )
    ).toBe("light")
  })
})
