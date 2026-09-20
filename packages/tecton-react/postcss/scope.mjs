/**
 * scope — wraps a micro-frontend remote's compiled Tailwind output in `@scope`.
 *
 * A remote that brings its own `@tecton/react` spells `bg-primary`, `text-sm` and
 * every component class exactly like its host does, and the two builds do not
 * necessarily mean the same thing by them. At equal layer and specificity the copy
 * injected last wins, and injection order follows chunk loading, not ownership. This
 * plugin runs after `@tailwindcss/postcss` and puts everything the remote emitted
 * inside `@scope (<its root>) to (<the next root below it>)`, which makes the cascade
 * decide by *scope proximity* instead: a scoped declaration is nearer to the remote's
 * elements than the host's unscoped copy, whatever the injection order, and the
 * `@scope` prelude itself adds no specificity, so nothing shifts weight relative to
 * the application's own overrides.
 *
 * Usage
 * -----
 *
 *   pnpm add -D postcss @tailwindcss/postcss
 *
 * ```js title="postcss.config.mjs"
 * import tailwindcss from "@tailwindcss/postcss"
 * import scopeTecton from "@tecton/react/postcss/scope"
 *
 * export default { plugins: [tailwindcss(), scopeTecton({ scope: ".mfe-a" })] }
 * ```
 *
 * The scope selector is one per deployable, not per mount, and is used in three
 * places: this option, `ThemeRoot`'s `className`, and the `identifierPrefix` of the
 * React root. The remote's stylesheet imports `@tecton/react/styles/scoped.css`
 * (utilities only — no variables, no preflight, no fonts), so the shell's tokens and
 * its current mode inherit into the mounted subtree untouched.
 *
 * The lower boundary
 * ------------------
 *
 * `@scope (.mfe-a)` alone reaches every descendant, including another remote mounted
 * inside this one — and a class that only *this* version emits would style that
 * remote's markup, with no copy of its own to beat it on proximity. The default
 * limit `[data-tecton-root]` ends the scope at the next Tecton root below: every
 * `ThemeRoot` marks its element, and its body-level overlay container, with that
 * attribute. A scope root that matches the limit selector is **not** excluded by its
 * own limit — a limit only applies to descendants — which is what lets the default
 * work at all, since the remote's own root carries the marker too; `:scope` keeps
 * selecting that root either way. Pass `boundary: false` for an unbounded scope, or
 * a selector of your own.
 *
 * What it does to the sheet
 * -------------------------
 *
 *   - `@charset`, `@import`, `@property`, `@font-face`, `@keyframes` and bodiless
 *     `@layer a, b;` order statements are document-global: inside `@scope` they are
 *     ignored, so they are hoisted to the top of the sheet, unchanged and in
 *     document order (`@charset` / `@import` keep coming first).
 *   - `:root` inside `@scope` matches nothing, because the scope root is not the
 *     document root. A selector whose *leading compound* is `:root`, `html` or `body`
 *     is therefore rewritten to `:scope`, keeping the rest of the compound and the
 *     rest of the selector (`:root` → `:scope`, `:root.dark` → `:scope.dark`,
 *     `html.dark .x` → `:scope.dark .x`), and a list member that is nothing but
 *     `:host` is dropped — Tailwind pairs `:root, :host` for a sheet adopted into a
 *     shadow root, which a remote never is. Tailwind's own defaults (`--spacing`, the
 *     `--text-*` and `--animate-*` scales, the `@layer properties` fallbacks hidden
 *     inside an `@supports`) then land on the remote's own root and inherit into its
 *     subtree and its body-level overlay container, instead of sitting at document
 *     level where two remotes built on different Tailwind versions would race for
 *     them. A `:root`, `:host`, `html` or `body` left anywhere else in a selector is
 *     an error naming the file and the line: under `@scope` it matches nothing, so it
 *     would be dead CSS rather than the global it was written as. Pass
 *     `rootRules: "document"` to keep such rules unscoped where they are instead, in
 *     the layer and the conditions they came with.
 *   - `@layer` blocks are recursed into, so the result is
 *     `@layer utilities { @scope (…) { … } }` and never a scope holding a layer.
 *   - Everything else — including unlayered output such as the vendored shadcn
 *     styles and their `@media (prefers-reduced-motion: reduce)` blocks — is wrapped.
 *   - A plain selector inside `@scope` matches the scope root's *descendants*, not
 *     the root itself, and `ThemeRoot` puts the scope class and `data-tecton-root`
 *     on one element. Selectors whose leading compound is `[data-tecton-root]`
 *     therefore get a `:scope`-anchored twin (`[data-tecton-root], :scope`), which is
 *     what makes `scoped.css`'s base reset and an opted-in `scoped-theme.css` apply
 *     to the remote's own root and to its overlay container while leaving the host's
 *     root alone. Selectors inside `@keyframes` are never rewritten.
 *
 * `@scope` needs Chrome/Edge 118+, Safari 17.4+, Firefox 146+. There is no polyfill;
 * an older browser falls back to the unscoped cascade, where the last sheet wins.
 *
 * Plain ESM with no build step and no runtime dependency: PostCSS hands the plugin
 * the `AtRule` constructor it needs through `OnceExit(root, helpers)`.
 */

/** Document-global at-rules: meaningless inside `@scope`, so they are hoisted. */
const GLOBAL_AT_RULES = new Set([
  "charset",
  "import",
  "property",
  "font-face",
  "keyframes",
])

/** The attribute every `ThemeRoot` puts on its element and its overlay container. */
const MARKER = "[data-tecton-root]"

const isKeyframes = (name) =>
  name === "keyframes" || /^-[a-z]+-keyframes$/.test(name)

const atRuleName = (node) => node.name.toLowerCase()

/**
 * `@layer a, b;` has no body: a layer-order statement, not a block — and global.
 */
const isGlobalAtRule = (node) => {
  const name = atRuleName(node)
  return (
    GLOBAL_AT_RULES.has(name) ||
    isKeyframes(name) ||
    (name === "layer" && !node.nodes)
  )
}

/**
 * `rootRules: "document"` only: the rules that stay at document level — wherever they
 * sit, keeping their layer and their conditions.
 */
const isRootRule = (node) =>
  node.type === "rule" &&
  node.selectors.every(
    (selector) => selector === ":root" || selector === ":host"
  )

const hasRootRule = (node) =>
  isRootRule(node) ||
  (node.type === "atrule" && (node.nodes ?? []).some(hasRootRule))

/** The whitespace a node sits at, so a generated sibling lines up with it. */
const indentOf = (before) => {
  const start = (before ?? "").lastIndexOf("\n")
  return start === -1 ? "" : before.slice(start + 1)
}

/**
 * Moving a subtree into a `@scope` puts it one level deeper: re-indent it, so the
 * sheet stays readable for whoever has to look at the compiled output.
 */
const indent = (node) => {
  if (node.raws.before?.includes("\n")) node.raws.before += "  "
  if (!node.nodes) return
  for (const child of node.nodes) indent(child)
  if (node.raws.after?.includes("\n")) node.raws.after += "  "
}

/** The leading compound that means "the document root", in either spelling. */
const LEADING_ROOT = /^(?::root|html|body)(?![\w-])/

/** A selector-list member that is nothing but `:host` / `:host(…)`. */
const HOST_ONLY = /^:host(?:\([^)]*\))?$/

/** Strings and attribute values carry arbitrary text: blank them before scanning. */
const blankValues = (selector) =>
  selector.replace(/"[^"]*"|'[^']*'/g, '""').replace(/\[[^\]]*\]/g, "[]")

/** What may not survive the rewrite, because under `@scope` it matches nothing. */
const LEFTOVER_PSEUDO = /:(?:root|host)(?![\w-])/
const LEFTOVER_ELEMENT = /(?<![\w.#:-])(?:html|body)(?![\w-])/

/**
 * The remote's root stands in for the document root: a leading `:root`, `html` or
 * `body` becomes `:scope`, keeping the rest of the compound and the rest of the
 * selector. A member that is only `:host` disappears — Tailwind pairs `:root, :host`
 * for a sheet adopted into a shadow root, which a remote never is.
 */
const toScope = (selector) =>
  HOST_ONLY.test(selector) ? null : selector.replace(LEADING_ROOT, ":scope")

/**
 * Anywhere but the leading compound, those selectors match nothing under `@scope`:
 * the rule would be dead CSS rather than the global it was written as, so name it,
 * with the file and the line, instead of shipping it.
 */
const assertScopable = (rule, selector) => {
  const bare = blankValues(selector)
  if (!LEFTOVER_PSEUDO.test(bare) && !LEFTOVER_ELEMENT.test(bare)) return
  throw rule.error(
    `\`${selector}\` matches nothing inside \`@scope\`: the scope root is not the document root, so \`:root\`, \`:host\`, \`html\` and \`body\` only mean anything as the leading compound. Write the rule against \`[data-tecton-root]\`, or pass \`rootRules: "document"\` to keep it at document level.`,
    { plugin: "tecton-scope" }
  )
}

/**
 * A plain selector inside `@scope` matches descendants only, and the remote's root
 * carries both the scope class and the marker: give it a `:scope` twin, keeping the
 * rest of the leading compound (`[data-tecton-root].dark` → `:scope.dark`).
 */
const twin = (selector) =>
  selector.startsWith(MARKER)
    ? [selector, `:scope${selector.slice(MARKER.length)}`]
    : [selector]

/** Rewrites one rule's selector list for the life it is about to lead in a scope. */
const anchor = (rule, rootRules) => {
  let selectors = rule.selectors
  if (rootRules === "scope") {
    selectors = selectors.flatMap((selector) => {
      const scoped = toScope(selector)
      if (scoped === null) return []
      assertScopable(rule, scoped)
      return [scoped]
    })
    // A rule that was only `:host` still has somewhere to go: the root itself.
    if (!selectors.length) selectors = [":scope"]
  }
  selectors = selectors.flatMap(twin)
  // `:root, :host` and `:root, html` alike collapse onto a single `:scope`.
  if (rootRules === "scope") selectors = [...new Set(selectors)]
  const unchanged =
    selectors.length === rule.selectors.length &&
    selectors.every((selector, index) => selector === rule.selectors[index])
  if (unchanged) return
  // Keep a selector list that was written one per line that way.
  const separator = rule.selector.includes("\n")
    ? `,\n${indentOf(rule.raws.before)}`
    : ", "
  rule.selector = selectors.join(separator)
}

/** Anchors every rule in the tree except the steps of a `@keyframes`. */
const anchorRules = (container, rootRules) => {
  for (const node of container.nodes ?? []) {
    if (node.type === "rule") anchor(node, rootRules)
    else if (node.type === "atrule" && !isKeyframes(atRuleName(node)))
      anchorRules(node, rootRules)
  }
}

const resolveBoundary = (boundary) => {
  if (boundary === undefined) return MARKER
  if (boundary === false || boundary === null) return null
  if (typeof boundary !== "string" || !boundary.trim()) {
    throw new TypeError(
      "scopeTecton: `boundary` must be a non-empty selector string, or `false` to scope without a lower limit."
    )
  }
  return boundary.trim()
}

const ROOT_RULE_MODES = new Set(["scope", "document"])

const resolveRootRules = (rootRules) => {
  if (rootRules === undefined) return "scope"
  if (!ROOT_RULE_MODES.has(rootRules)) {
    throw new TypeError(
      'scopeTecton: `rootRules` must be "scope" (rewrite a leading `:root` / `html` / `body` to `:scope`) or "document" (leave those rules unscoped where they are).'
    )
  }
  return rootRules
}

/**
 * @param {{ scope: string, boundary?: string | false | null, rootRules?: "scope" | "document" }} options
 */
export default function scopeTecton(options) {
  const { scope, boundary, rootRules } = options ?? {}
  if (typeof scope !== "string" || !scope.trim()) {
    throw new TypeError(
      'scopeTecton: `scope` is required and must be a non-empty selector string, e.g. scopeTecton({ scope: ".mfe-a" }).'
    )
  }
  const root = scope.trim()
  const limit = resolveBoundary(boundary)
  const roots = resolveRootRules(rootRules)
  const params = limit ? `(${root}) to (${limit})` : `(${root})`

  return {
    postcssPlugin: "tecton-scope",
    OnceExit(sheet, { AtRule }) {
      /** Document-global at-rules, in the order they appeared. */
      const global = []
      const lift = (container) => {
        for (const node of [...container.nodes]) {
          if (node.type !== "atrule") continue
          if (isGlobalAtRule(node)) global.push(node.remove())
          else if (node.nodes) lift(node)
        }
      }
      lift(sheet)

      /**
       * Wraps each run of scopable children in one `@scope`; a `@layer` is recursed
       * into instead, and so, in `"document"` mode, is any at-rule holding a `:root`
       * / `:host` rule. With the roots rewritten to `:scope` those are ordinary
       * scoped rules, so their at-rule is wrapped like any other.
       */
      const scopeInto = (container) => {
        let run = []
        const flush = () => {
          if (!run.length) return
          const before = run[0].raws.before ?? "\n"
          const scoped = new AtRule({ name: "scope", params })
          container.insertBefore(run[0], scoped)
          scoped.append(run)
          for (const node of run) indent(node)
          if (!run[0].raws.before?.includes("\n")) {
            run[0].raws.before = `\n${indentOf(before)}  `
          }
          anchorRules(scoped, roots)
          scoped.raws.before = before
          scoped.raws.between = " "
          scoped.raws.after = `\n${indentOf(before)}`
          run = []
        }
        for (const node of [...container.nodes]) {
          const recurse =
            node.type === "atrule" &&
            node.nodes &&
            (atRuleName(node) === "layer" ||
              (roots === "document" && hasRootRule(node)))
          if (roots === "document" && isRootRule(node)) flush()
          else if (recurse) {
            flush()
            scopeInto(node)
          } else run.push(node)
        }
        flush()
      }
      scopeInto(sheet)

      // `@charset` / `@import` keep their document order, and the first rule that
      // stayed behind keeps a line of its own: removing the old first node hands its
      // `before` to its successor.
      if (global.length) {
        sheet.prepend(global)
        global.forEach((node, index) => {
          node.raws.before = index === 0 ? "" : "\n"
        })
        const next = sheet.nodes[global.length]
        if (next && !next.raws.before) next.raws.before = "\n"
      }
    },
  }
}

scopeTecton.postcss = true
