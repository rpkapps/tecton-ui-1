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
 *     document order (`@charset` / `@import` keep coming first). One that sat
 *     inside `@media` / `@supports` is hoisted inside a copy of those conditions,
 *     so it still applies only where it did; a condition left empty is dropped.
 *   - Being document-global, a `@keyframes` is also last-definition-wins, and two
 *     remotes hoist their frames into the same document: whichever `shimmer` was
 *     parsed last animates both. So every set of frames *this sheet defines* is
 *     renamed `<name>--<suffix>`, with the suffix derived from the scope selector
 *     (`.mfe-a` → `shimmer--mfe-a`), and the references to exactly those names are
 *     rewritten in `animation`, `animation-name` and any `--animate-*` custom
 *     property — the three places a name can appear, since `@theme inline` inlines
 *     the variable into the shorthand. A name the sheet does not define is one the
 *     host owns, and is never touched. `keyframes: { suffix }` sets the suffix,
 *     `keyframes: false` keeps the names as they are.
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
 *     root alone. Selectors inside `@keyframes` — the steps — are never rewritten.
 *
 * Running the plugin twice over the same sheet changes nothing the second time: a
 * `@scope` with the same prelude is left as it is, and a keyframe name that
 * already ends in `--<suffix>` is not renamed again.
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

/**
 * A class or id name, escapes included: Tailwind's named groups and peers
 * (`.group\/body`, `.peer\/html`) and arbitrary values (`.w-\[10px\]`) spell
 * `body` or `html` inside an escaped identifier, which names no element. A CSS
 * escape is a backslash and one character, or up to six hex digits and an
 * optional space; anything outside ASCII is an identifier character too.
 */
const IDENTIFIER_TOKEN =
  /[.#](?:\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\[^\n\r\f0-9a-fA-F]|[\w-]|[^\x00-\x7f])+/g

/**
 * Class and id names, strings and attribute values carry arbitrary text: blank
 * them before scanning. Identifiers go first, so an escaped quote or bracket
 * inside a class name (`.content-\[\"x\"\]`) never opens a string or an
 * attribute.
 */
const blankValues = (selector) =>
  selector
    .replace(IDENTIFIER_TOKEN, "")
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/\[[^\]]*\]/g, "[]")

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

/** A keyframe suffix is part of an identifier, so it may hold nothing else. */
const IDENTIFIER = /^[A-Za-z0-9_-]+$/

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** `.mfe-a` → `mfe-a`, `[data-mfe-scope="operations"]` → `data-mfe-scope-operations`. */
const identifierSafe = (value) =>
  value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")

const resolveKeyframes = (keyframes, scope) => {
  if (keyframes === false || keyframes === null) return null
  if (keyframes === undefined || keyframes === true) {
    const derived = identifierSafe(scope)
    if (!derived) {
      throw new TypeError(
        `scopeTecton: no keyframe suffix can be derived from \`scope\` (${scope}). Pass \`keyframes: { suffix: "…" }\`, or \`keyframes: false\` to leave the names alone.`
      )
    }
    return derived
  }
  const suffix = keyframes?.suffix
  if (typeof suffix !== "string" || !IDENTIFIER.test(suffix)) {
    throw new TypeError(
      "scopeTecton: `keyframes` must be `{ suffix }` with a non-empty identifier ([A-Za-z0-9_-]), `false` to keep the names as they are, or left out to derive the suffix from `scope`."
    )
  }
  return suffix
}

/** The three places an animation name appears, and nowhere else. */
const namesAnimation = (prop) =>
  prop.startsWith("--")
    ? prop.startsWith("--animate-")
    : prop.toLowerCase() === "animation" ||
      prop.toLowerCase() === "animation-name"

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
 * @param {{ scope: string, boundary?: string | false | null, rootRules?: "scope" | "document", keyframes?: { suffix: string } | boolean }} options
 */
export default function scopeTecton(options) {
  const { scope, boundary, rootRules, keyframes } = options ?? {}
  if (typeof scope !== "string" || !scope.trim()) {
    throw new TypeError(
      'scopeTecton: `scope` is required and must be a non-empty selector string, e.g. scopeTecton({ scope: ".mfe-a" }).'
    )
  }
  const root = scope.trim()
  const limit = resolveBoundary(boundary)
  const roots = resolveRootRules(rootRules)
  const suffix = resolveKeyframes(keyframes, root)
  const params = limit ? `(${root}) to (${limit})` : `(${root})`

  return {
    postcssPlugin: "tecton-scope",
    OnceExit(sheet, { AtRule }) {
      /**
       * A hoisted `@keyframes` is last-definition-wins for the whole document, so
       * the frames this sheet defines get a name of the remote's own — and every
       * reference to one of those names, wherever an animation names it, follows.
       */
      const versionKeyframes = () => {
        const defined = new Set()
        // A name that already carries the suffix was versioned by an earlier run
        // over the same sheet: its frames keep that name (renaming them again
        // would give `spin--mfe-a--mfe-a`), and a reference to the name it was
        // versioned from still follows it.
        const versioned = `--${suffix}`
        sheet.walkAtRules((node) => {
          if (!isKeyframes(atRuleName(node))) return
          const name = node.params.trim()
          defined.add(
            name.endsWith(versioned) ? name.slice(0, -versioned.length) : name
          )
        })
        defined.delete("")
        if (!defined.size) return
        const names = [...defined].sort((a, b) => b.length - a.length)
        // `(?![\w-])` is what keeps `spin` out of `spin-slow`.
        const pattern = new RegExp(
          `(?<![\\w-])(?:${names.map(escapeRegExp).join("|")})(?![\\w-])`,
          "g"
        )
        const version = (value) =>
          value.replace(pattern, (name) => `${name}--${suffix}`)
        sheet.walkAtRules((node) => {
          if (isKeyframes(atRuleName(node))) node.params = version(node.params)
        })
        sheet.walkDecls((decl) => {
          if (namesAnimation(decl.prop)) decl.value = version(decl.value)
        })
      }
      if (suffix) versionKeyframes()

      /**
       * Document-global at-rules, in the order they appeared. One that sat inside
       * a condition — `@supports (…) { @font-face { … } }`, `@media (…) {
       * @keyframes … }` — is hoisted inside a copy of that chain of conditions, so
       * it keeps applying only where it did; consecutive ones under the same chain
       * share one copy. A `@layer` is not a condition and is not copied: a layer
       * block at the top of the sheet would declare that layer's position in the
       * order earlier than the sheet does.
       */
      const global = []
      let lastChain = null
      let lastWrapper = null
      const sameChain = (a, b) =>
        a !== null &&
        a.length === b.length &&
        a.every((node, index) => node === b[index])
      const hoist = (node, conditions) => {
        node.remove()
        if (!conditions.length) {
          global.push(node)
          lastChain = null
          return
        }
        if (sameChain(lastChain, conditions)) {
          lastWrapper.append(node)
          return
        }
        let outer = null
        let inner = null
        for (const condition of conditions) {
          const copy = condition.clone({ nodes: [] })
          if (inner) inner.append(copy)
          else outer = copy
          inner = copy
        }
        inner.append(node)
        global.push(outer)
        lastChain = conditions
        lastWrapper = inner
      }
      const lift = (container, conditions) => {
        for (const node of [...container.nodes]) {
          if (node.type !== "atrule") continue
          if (isGlobalAtRule(node)) {
            hoist(node, conditions)
            continue
          }
          if (!node.nodes) continue
          const condition = atRuleName(node) !== "layer"
          const count = node.nodes.length
          lift(node, condition ? [...conditions, node] : conditions)
          // A condition that held nothing but hoisted at-rules is left empty:
          // drop it rather than wrap it in a scope. An emptied `@layer` stays,
          // since it still declares the layer's place in the order.
          if (condition && count && !node.nodes.length) node.remove()
        }
      }
      lift(sheet, [])

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
          // Already scoped by an earlier run over the same sheet (a sheet that is
          // processed twice, or one that concatenates an already scoped chunk):
          // wrapping it again would nest `@scope` inside `@scope`.
          if (
            node.type === "atrule" &&
            atRuleName(node) === "scope" &&
            node.params === params
          ) {
            flush()
            continue
          }
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
