import { describe, expect, it } from "vitest"

import {
  collapseSourcePaths,
  directivesOf,
  exportsSubpath,
  specifiersOf,
  splitSpecifier,
} from "../build-checks.mjs"

describe("collapseSourcePaths", () => {
  const OUT = '@source "../**/*.js";'

  it("collapses every plain `@source` path into one, where the first was", () => {
    const css = [
      '@import "tailwindcss";',
      '@source "../../../apps/**/*.{ts,tsx}";',
      "@source '../**/*.{ts,tsx}';",
      "@theme inline {}",
    ].join("\r\n")

    expect(collapseSourcePaths(css, OUT)).toBe(
      ['@import "tailwindcss";', OUT, "@theme inline {}"].join("\n")
    )
  })

  it("leaves `@source inline(…)` and `@source not …` alone", () => {
    const css = [
      '@source inline("{hover:,}bg-red-{50,100}");',
      '@source "../**/*.tsx";',
      '@source not "../legacy";',
      '@source not inline("container");',
    ].join("\n")

    expect(collapseSourcePaths(css, OUT)).toBe(
      [
        '@source inline("{hover:,}bg-red-{50,100}");',
        OUT,
        '@source not "../legacy";',
        '@source not inline("container");',
      ].join("\n")
    )
  })
})

describe("directivesOf", () => {
  it("reads the prologue past comments and whitespace", () => {
    expect(directivesOf('"use client";\n\nimport x from "x"')).toEqual([
      "use client",
    ])
    expect(
      directivesOf(
        "// GENERATED\n/* header */\n'use strict'\n\"use client\"\nexport {}"
      )
    ).toEqual(["use strict", "use client"])
  })

  it("stops at the first statement that is not a directive", () => {
    expect(directivesOf('import "x";\n"use client";')).toEqual([])
    expect(directivesOf('"use client".length')).toEqual([])
    expect(directivesOf("")).toEqual([])
  })
})

describe("specifiersOf", () => {
  it("finds imports, re-exports, side-effect and dynamic imports", () => {
    const js = [
      '"use client";',
      'import * as React from "react";',
      "import {",
      "  a,",
      "  b",
      '} from "./types.js";',
      'export { cn } from "cn";',
      'import "./side-effect.js";',
      'const lazy = () => import("recharts");',
      'const text = "import nothing from here";',
    ].join("\n")

    expect(specifiersOf("x.js", js)).toEqual([
      "react",
      "./types.js",
      "cn",
      "./side-effect.js",
      "recharts",
    ])
  })

  it("reads a stylesheet's `@import`s, not the ones in comments", () => {
    const css =
      '/* @import "@tecton/react/styles/scoped.css"; */\n@import "tailwindcss";\n@import url("./tecton-tokens.css");'

    expect(specifiersOf("globals.css", css)).toEqual([
      "tailwindcss",
      "./tecton-tokens.css",
    ])
  })
})

describe("splitSpecifier", () => {
  it("separates the package from the subpath", () => {
    expect(splitSpecifier("react")).toEqual(["react", "."])
    expect(splitSpecifier("react/jsx-runtime")).toEqual([
      "react",
      "./jsx-runtime",
    ])
    expect(splitSpecifier("@fontsource/figtree/400.css")).toEqual([
      "@fontsource/figtree",
      "./400.css",
    ])
    expect(splitSpecifier("@tecton/react/lib/utils")).toEqual([
      "@tecton/react",
      "./lib/utils",
    ])
  })
})

describe("exportsSubpath", () => {
  it("accepts any subpath of a package without an exports map", () => {
    expect(exportsSubpath(undefined, "./anything")).toBe(true)
  })

  it("matches exact keys and `*` patterns", () => {
    const exports = {
      ".": { default: "./index.css" },
      "./*.css": "./*.css",
      "./package.json": "./package.json",
    }
    expect(exportsSubpath(exports, ".")).toBe(true)
    expect(exportsSubpath(exports, "./400.css")).toBe(true)
    expect(exportsSubpath(exports, "./package.json")).toBe(true)
    expect(exportsSubpath(exports, "./400.js")).toBe(false)
  })

  it("treats a string or a conditions object as the root export only", () => {
    expect(exportsSubpath("./index.js", ".")).toBe(true)
    expect(exportsSubpath("./index.js", "./sub")).toBe(false)
    expect(exportsSubpath({ import: "./a.mjs", style: "./a.css" }, ".")).toBe(
      true
    )
    expect(
      exportsSubpath({ import: "./a.mjs", style: "./a.css" }, "./sub")
    ).toBe(false)
  })
})
