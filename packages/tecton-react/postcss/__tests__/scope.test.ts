import postcss from "postcss"
import { describe, expect, it } from "vitest"

import type { AtRule, ChildNode, Container, Root } from "postcss"
import scopeTecton from "../scope.mjs"

/**
 * A slice of what `@tailwindcss/postcss` emits for a remote that imports
 * `@tecton/react/styles/scoped.css`: the layer order statement, the theme layer's
 * `:root, :host` defaults, the base reset written against `[data-tecton-root]`, a
 * few utilities, the vendored shadcn styles (unlayered, with a reduced-motion
 * block) and the `@layer properties` fallbacks hidden inside an `@supports`.
 */
const TAILWIND = `@charset "utf-8";
@import "./fonts.css";
@layer theme, base, components, utilities;
@layer theme {
  :root, :host {
    --spacing: 0.25rem;
    --text-sm: 0.875rem;
    --color-primary: var(--primary, var(--tecton-color-action-primary-bg, #644a78));
  }
}
@layer base {
  [data-tecton-root],
  [data-tecton-root] * {
    border-color: var(--color-border);
    outline-color: color-mix(in oklab, var(--color-ring) 50%, transparent);
  }
  [data-tecton-root]:where(.dark, .dark *, [data-theme="dark"]) * {
    color-scheme: dark;
  }
  [data-tecton-root].dark {
    color-scheme: dark;
  }
}
@layer utilities {
  .bg-primary {
    background-color: var(--color-primary);
  }
  .text-sm {
    font-size: var(--text-sm);
  }
  @media (min-width: 48rem) {
    .md\\:flex {
      display: flex;
    }
  }
}
@font-face {
  font-family: Figtree;
  src: url("./figtree.woff2") format("woff2");
}
@keyframes shimmer {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 100% 0;
  }
}
@-webkit-keyframes shimmer {
  from {
    background-position: 0 0;
  }
}
@property --tw-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
[data-slot="shimmer"] {
  animation: shimmer 2s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  [data-slot="shimmer"] {
    animation: none;
  }
}
@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) {
    :root, :host {
      --tw-shadow: 0 0 #0000;
    }
  }
}
`

function run(
  css: string,
  options: Parameters<typeof scopeTecton>[0],
  from?: string
) {
  return postcss([scopeTecton(options)]).process(css, { from }).css
}

const parse = (css: string) => postcss.parse(css)

const children = (container: Container | undefined) => container?.nodes ?? []

/** `@layer utilities` → its node, by prelude. */
function layer(root: Root, params: string) {
  return children(root).find(
    (node): node is AtRule =>
      node.type === "atrule" && node.name === "layer" && node.params === params
  )
}

/** The one `@scope` a container holds, if any. */
function scopeIn(container: Container | undefined) {
  return children(container).find(
    (node): node is AtRule => node.type === "atrule" && node.name === "scope"
  )
}

/** Selectors of every rule in a subtree, with a multi-line list folded onto one. */
const selectorsIn = (container: Container | undefined) => {
  const found: Array<string> = []
  container?.walkRules((rule) => {
    found.push(rule.selector.replace(/\s+/g, " "))
  })
  return found
}

const describeNode = (node: ChildNode) =>
  node.type === "atrule"
    ? `@${node.name} ${node.params}`.trim()
    : (node as { selector: string }).selector

describe("scopeTecton", () => {
  it("is a plugin creator postcss.config can list by reference", () => {
    expect(scopeTecton.postcss).toBe(true)
    expect(scopeTecton({ scope: ".mfe-a" }).postcssPlugin).toBe("tecton-scope")
  })

  it("hoists the document-global at-rules to the top of the sheet, in document order", () => {
    const root = parse(run(TAILWIND, { scope: ".mfe-a" }))

    expect(children(root).slice(0, 7).map(describeNode)).toEqual([
      '@charset "utf-8"',
      '@import "./fonts.css"',
      "@layer theme, base, components, utilities",
      "@font-face",
      "@keyframes shimmer",
      "@-webkit-keyframes shimmer",
      "@property --tw-shadow",
    ])
  })

  it("keeps the hoisted at-rules verbatim, keyframe steps included", () => {
    const css = run(TAILWIND, { scope: ".mfe-a" })

    expect(css).toContain('@import "./fonts.css";')
    expect(css).toContain('src: url("./figtree.woff2") format("woff2");')
    expect(css).toContain('syntax: "*";')

    const keyframes = children(parse(css)).find(
      (node): node is AtRule =>
        node.type === "atrule" && node.name === "keyframes"
    )
    expect(selectorsIn(keyframes)).toEqual(["from", "to"])
  })

  it("never wraps a hoisted at-rule in a scope", () => {
    const root = parse(run(TAILWIND, { scope: ".mfe-a" }))
    const names: Array<string> = []
    root.walkAtRules("scope", (scope) => {
      scope.walkAtRules((inner) => {
        names.push(inner.name)
      })
    })

    expect(names).not.toContain("keyframes")
    expect(names).not.toContain("property")
    expect(names).not.toContain("font-face")
    expect(names).not.toContain("import")
  })

  it("puts Tailwind's `:root, :host` defaults on the remote's own root, inside their layer", () => {
    const theme = layer(parse(run(TAILWIND, { scope: ".mfe-a" })), "theme")
    const scope = scopeIn(theme)

    expect(scope?.params).toBe("(.mfe-a) to ([data-tecton-root])")
    expect(selectorsIn(scope)).toEqual([":scope"])
    expect(scope?.toString()).toContain("--spacing: 0.25rem;")
  })

  it("rewrites a leading `:root`, `html` or `body`, keeping the rest of the selector", () => {
    const css = run(
      `:root.dark { --x: 1 }
       html.dark .x { color: red }
       body > .y { color: red }
       :root { --z: 2 }`,
      { scope: ".mfe-a" }
    )

    expect(selectorsIn(parse(css))).toEqual([
      ":scope.dark",
      ":scope.dark .x",
      ":scope > .y",
      ":scope",
    ])
  })

  it("drops a `:host` member, and keeps a `:host`-only rule on the root", () => {
    const css = run(":host, :root { --x: 1 }\n:host(.dark) { --y: 2 }\n", {
      scope: ".mfe-a",
    })

    expect(selectorsIn(parse(css))).toEqual([":scope", ":scope"])
    expect(css).not.toContain(":host")
  })

  it("refuses a `:root`, `html` or `body` that is not the leading compound", () => {
    expect(() =>
      run(`.bg-primary { color: red }\n.dark body .x { color: red }\n`, {
        scope: ".mfe-a",
      })
    ).toThrow(/`\.dark body \.x` matches nothing inside `@scope`/)

    expect(() =>
      run(
        `.bg-primary { color: red }\n.dark body .x { color: red }\n`,
        { scope: ".mfe-a" },
        "src/styles/remote.css"
      )
    ).toThrow(/remote\.css:2:1/)

    expect(() => run(`.x :root { color: red }`, { scope: ".mfe-a" })).toThrow(
      /matches nothing inside `@scope`/
    )
    expect(() =>
      run(`.x:where(html) { color: red }`, { scope: ".mfe-a" })
    ).toThrow(/matches nothing inside `@scope`/)
  })

  it("does not mistake a class or an attribute value for the document root", () => {
    const css = run(
      `.body [data-slot="html"] { color: red }\n.card [data-tecton-root] { color: red }\n`,
      { scope: ".mfe-a" }
    )

    expect(selectorsIn(parse(css))).toEqual([
      '.body [data-slot="html"]',
      ".card [data-tecton-root]",
    ])
  })

  it("never rewrites the steps of a `@keyframes`", () => {
    const root = parse(run(TAILWIND, { scope: ".mfe-a" }))
    const frames = children(root).filter(
      (node): node is AtRule =>
        node.type === "atrule" && node.name.endsWith("keyframes")
    )

    expect(frames.map((frame) => selectorsIn(frame))).toEqual([
      ["from", "to"],
      ["from"],
    ])
  })

  it("wraps the `@supports` of `@layer properties` instead of recursing into it", () => {
    const properties = layer(
      parse(run(TAILWIND, { scope: ".mfe-a" })),
      "properties"
    )
    const scope = scopeIn(properties)
    const supports = children(scope)[0] as AtRule

    expect(supports.name).toBe("supports")
    expect(selectorsIn(supports)).toEqual([":scope"])
  })

  it('leaves Tailwind\'s `:root, :host` defaults unscoped with `rootRules: "document"`', () => {
    const theme = layer(
      parse(run(TAILWIND, { scope: ".mfe-a", rootRules: "document" })),
      "theme"
    )

    expect(scopeIn(theme)).toBeUndefined()
    expect(selectorsIn(theme)).toEqual([":root, :host"])
  })

  it('recurses into the `@supports` of `@layer properties` with `rootRules: "document"`', () => {
    const properties = layer(
      parse(run(TAILWIND, { scope: ".mfe-a", rootRules: "document" })),
      "properties"
    )
    const supports = children(properties)[0] as AtRule

    expect(scopeIn(properties)).toBeUndefined()
    expect(supports.name).toBe("supports")
    expect(scopeIn(supports)).toBeUndefined()
    expect(selectorsIn(supports)).toEqual([":root, :host"])
  })

  it("rejects a `rootRules` that is neither mode", () => {
    // @ts-expect-error — the guard exists for JavaScript callers.
    expect(() => scopeTecton({ scope: ".mfe-a", rootRules: "root" })).toThrow(
      /`rootRules`/
    )
    // @ts-expect-error — as above.
    expect(() => scopeTecton({ scope: ".mfe-a", rootRules: false })).toThrow(
      /`rootRules`/
    )
  })

  it("scopes inside a layer, never a layer inside a scope", () => {
    const css = run(TAILWIND, { scope: ".mfe-a" })
    const utilities = layer(parse(css), "utilities")
    const scope = scopeIn(utilities)

    expect(scope?.params).toBe("(.mfe-a) to ([data-tecton-root])")
    expect(selectorsIn(scope)).toEqual([
      ".bg-primary",
      ".text-sm",
      ".md\\:flex",
    ])
    expect(css).not.toMatch(/@scope[^{]*\{[^}]*@layer/)
  })

  it("keeps a conditional at-rule inside the scope it belongs to", () => {
    const utilities = layer(
      parse(run(TAILWIND, { scope: ".mfe-a" })),
      "utilities"
    )
    const media = children(scopeIn(utilities)).find(
      (node): node is AtRule => node.type === "atrule" && node.name === "media"
    )

    expect(media?.params).toBe("(min-width: 48rem)")
  })

  it("wraps unlayered rules and their `@media` blocks", () => {
    const root = parse(run(TAILWIND, { scope: ".mfe-a" }))
    const scope = children(root).find(
      (node): node is AtRule => node.type === "atrule" && node.name === "scope"
    )

    expect(scope?.params).toBe("(.mfe-a) to ([data-tecton-root])")
    expect(children(scope).map(describeNode)).toEqual([
      '[data-slot="shimmer"]',
      "@media (prefers-reduced-motion: reduce)",
    ])
    expect(selectorsIn(scope)).toEqual([
      '[data-slot="shimmer"]',
      '[data-slot="shimmer"]',
    ])
  })

  it("gives a `:scope` twin to every `[data-tecton-root]`-led selector", () => {
    const base = layer(parse(run(TAILWIND, { scope: ".mfe-a" })), "base")

    expect(selectorsIn(scopeIn(base))).toEqual([
      "[data-tecton-root], :scope, [data-tecton-root] *, :scope *",
      '[data-tecton-root]:where(.dark, .dark *, [data-theme="dark"]) *, :scope:where(.dark, .dark *, [data-theme="dark"]) *',
      "[data-tecton-root].dark, :scope.dark",
    ])
  })

  it("leaves selectors that only mention the marker deeper alone", () => {
    const css = run(
      `.card [data-tecton-root] { color: red }
       .bg-primary { color: red }`,
      { scope: ".mfe-a" }
    )

    expect(selectorsIn(parse(css))).toEqual([
      ".card [data-tecton-root]",
      ".bg-primary",
    ])
    expect(css).not.toContain(":scope")
  })

  it("scopes without a lower limit when `boundary` is false", () => {
    const css = run(".bg-primary { color: red }", {
      scope: ".mfe-a",
      boundary: false,
    })

    expect(css).toContain("@scope (.mfe-a) {")
    expect(css).not.toContain(" to (")
  })

  it("takes a boundary of its own", () => {
    const css = run(".bg-primary { color: red }", {
      scope: "#remote",
      boundary: ".mfe-boundary",
    })

    expect(css).toContain("@scope (#remote) to (.mfe-boundary)")
  })

  it("rejects a missing or empty scope", () => {
    // @ts-expect-error — the guard exists for JavaScript callers.
    expect(() => scopeTecton()).toThrow(/`scope` is required/)
    // @ts-expect-error — as above.
    expect(() => scopeTecton({})).toThrow(/`scope` is required/)
    expect(() => scopeTecton({ scope: "   " })).toThrow(/`scope` is required/)
    // @ts-expect-error — as above.
    expect(() => scopeTecton({ scope: 42 })).toThrow(/`scope` is required/)
  })

  it("rejects a boundary that is neither a selector nor false", () => {
    // @ts-expect-error — the guard exists for JavaScript callers.
    expect(() => scopeTecton({ scope: ".mfe-a", boundary: 1 })).toThrow(
      /`boundary`/
    )
    expect(() => scopeTecton({ scope: ".mfe-a", boundary: "" })).toThrow(
      /`boundary`/
    )
  })

  it("leaves a sheet with nothing to scope alone", () => {
    const css = run('@charset "utf-8";\n@layer theme, utilities;\n', {
      scope: ".mfe-a",
    })

    expect(css).not.toContain("@scope")
    expect(css.trim()).toBe('@charset "utf-8";\n@layer theme, utilities;')
  })
})
