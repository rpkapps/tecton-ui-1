/**
 * Design-system guardrails for applications built with `@tecton/react`.
 *
 * Tecton is an enterprise design system: the look is owned by the components
 * and the theme, not by the application. This config wraps `@shadcn/lint` — an
 * agent-first linter for Tailwind design systems — with the Tecton component
 * surface and the Tecton policy on what an application may restyle.
 *
 * It matters most for the failures that are otherwise *silent*. Tecton resets
 * Tailwind's stock palette (`--color-*: initial` in `globals.css`), so
 * `bg-red-500` generates no CSS at all: it type-checks, it lints clean under a
 * normal setup, and it renders unstyled. `no-raw-colors` and
 * `no-unknown-classes` read the project's real Tailwind theme, turn that into
 * an error, and name the nearest Tecton token to use instead.
 *
 * Every rule here is scoped to Tecton components. An application's own
 * components and its plain markup belong to the application, and a guardrail
 * that errors on someone else's `<div>` is a guardrail they switch off — so
 * `recommended`, `strict` and `warn` all leave them alone, and widening the
 * rules to the whole project is a separate, deliberate opt-in (`project`).
 *
 * Usage (consumer app, eslint.config.js):
 *
 *     import tecton from "@tecton/eslint-config"
 *
 *     export default [
 *       ...tecton.configs.recommended,
 *     ]
 *
 * The rules resolve the theme from the Tailwind entry stylesheet named by the
 * app's `components.json` (`tailwind.css`). Point that at the CSS file that
 * imports `@tecton/react/globals.css`, or every project-specific token is
 * reported as unknown.
 */
import { plugin as shadcn } from "@shadcn/lint"

/** Where Tecton components come from — the linter treats these as owned. */
const componentImports = ["^@tecton/react(/|$)"]

/**
 * Utilities a Tecton component owns through its variants. Layout is free —
 * an application must be able to place a component — but the control's own
 * box and appearance are the design system's. `h-12` or `p-6` on a Button is
 * a size variant being overridden by hand; `w-full`, `mt-4` and `flex-1` are
 * composition and stay allowed.
 *
 * Height, width and margin share one `spacing` category in the linter, so the
 * split cannot be expressed with categories alone: allow the category, then
 * deny the class groups the component owns. `deny` wins over `allow`.
 */
const variantOwned = [
  "h-*",
  "min-h-*",
  "max-h-*",
  "size-*",
  "p-*",
  "px-*",
  "py-*",
  "pt-*",
  "pr-*",
  "pb-*",
  "pl-*",
  "ps-*",
  "pe-*",
]

/** Composition utilities an application legitimately needs. */
const allowed = ["layout", "position", "spacing"]

const settings = {
  shadcn: {
    componentImports,
    // `cn` is Tecton's class merger; `cva` builds the variants.
    mergeFunctions: ["cn"],
    variantFunctions: ["cva"],
    note: "See the Tecton UI docs (/docs/linting) for the design-system rules.",
  },
}

/**
 * The stock messages invite an application to declare a new `--color-*` when a
 * colour is missing. That is right for a project that owns its own theme and
 * wrong here: the palette is the Tecton token export, `globals.css` ships
 * inside `@tecton/react` and is generated, and a colour invented in an
 * application is off-ramp, unreviewed, and has no dark-mode pair or contrast
 * check. Point at the palette instead, and route genuinely missing colours to
 * the design system rather than to the nearest CSS file.
 */
const messages = {
  rawColor:
    '"{{className}}" is not a Tecton colour, so it generates no CSS and renders unstyled. ' +
    "Nearest Tecton tokens: {{suggestions}}. Use one of those, a semantic token " +
    "(bg-primary, text-muted-foreground) or a palette step (bg-blue-120). " +
    "A colour the palette does not cover is a change to the Tecton token " +
    "export — raise it with the design system rather than declaring one here.",
  arbitrary:
    '"{{className}}" hardcodes an off-token value. Use the scale ({{suggestions}}). ' +
    "Tecton owns the spacing, radius and type scales; an arbitrary value silently leaves them.",
  unknown:
    '"{{className}}" is not a class this project\'s Tailwind can generate, so it produces no CSS. ' +
    "Check the spelling against the Tecton palette and tokens; do not add a utility to work around it.",
}

/**
 * Stock shadcn/ui components installed from the public registry. Tecton ships
 * its components in the package, so a file under a `components/ui` directory
 * means someone ran `shadcn add <name>` against the default registry and got a
 * Radix component with the stock palette — the wrong base and the wrong theme.
 */
const restrictedImports = {
  // `paths` matches the specifier exactly; a `patterns` glob would also catch
  // every legitimate `@tecton/react/components/*` subpath import.
  paths: [
    {
      name: "@tecton/react",
      message:
        "@tecton/react has no root export. Import the module directly: @tecton/react/components/<name>, @tecton/react/tecton/<name> or @tecton/react/icons.",
    },
  ],
  patterns: [
    {
      group: ["**/components/ui/*"],
      message:
        "Stock shadcn/ui component. Tecton components are imported from the package: @tecton/react/components/<name>. Only blocks are installed from the @tecton registry.",
    },
  ],
}

/**
 * Rules that look only at Tecton components — elements whose import matches
 * `componentImports`. An application's own components and its plain markup are
 * not the design system's business, and a linter that errors on someone else's
 * `<div>` is a linter they switch off.
 *
 * `no-restyle` already covers colour, shape, typography, size and spacing on a
 * Tecton component, so scoping this way loses no protection of the components
 * themselves: `<Button className="bg-red-500">` is still an error.
 */
const scopedRules = {
  "shadcn/no-restyle": ["error", { allow: allowed, deny: variantOwned }],
  "shadcn/require-static-classes": "error",
  "no-restricted-imports": ["error", restrictedImports],
}

/**
 * The theme rules read *every* `className` in the file, not only the ones on a
 * Tecton component, so on their own they report an application's own markup.
 * This scopes them back to the design system.
 *
 * Their `allow`/`contracts` options are an exemption list — a token the policy
 * allows is skipped, everything else is reported — and the rules look the
 * policy up by the name of the component the class sits on, falling back to the
 * baseline when there is no component, which is the case for plain markup.
 * Exempting everything at the baseline and withdrawing the exemption for any
 * component name therefore scopes the rule to Tecton components without
 * weakening a single check on them.
 */
const componentsOnly = {
  allow: ["*"],
  contracts: [{ pattern: "^[A-Z]", allow: [] }],
}

/**
 * Theme rules on Tecton components, added by `strict`. `no-restyle` already
 * covers the colour, shape, typography and size a component owns, so these add
 * the classes its contract *allows*: an off-scale `mt-[13px]`, a `grid-cols-[…]`
 * the theme cannot generate, a layout utility that is a typo.
 */
const themeRules = {
  "shadcn/no-raw-colors": [
    "error",
    { ...componentsOnly, message: messages.rawColor },
  ],
  "shadcn/no-unknown-classes": [
    "error",
    { ...componentsOnly, message: messages.unknown },
  ],
  "shadcn/no-arbitrary-values": [
    "error",
    { ...componentsOnly, message: messages.arbitrary },
  ],
}

/**
 * The same rules over the whole project, added by `project`. They catch real
 * breakage — `bg-red-500` generates no CSS anywhere, including in an
 * application's own component — but they police code the design system does not
 * own, which is why no preset a team reaches for by default includes them.
 */
const projectRules = {
  "shadcn/no-raw-colors": ["error", { message: messages.rawColor }],
  "shadcn/no-unknown-classes": ["error", { message: messages.unknown }],
  "shadcn/no-arbitrary-values": ["error", { message: messages.arbitrary }],
  // `no-inline-styles` reports a `style` prop it cannot read — `style={style}`
  // forwarded from props — before it consults its policy, and on any element.
  // That cannot be scoped to Tecton components, so it stays project-only.
  "shadcn/no-inline-styles": "error",
}

const base = {
  files: ["**/*.{js,jsx,ts,tsx}"],
  plugins: { shadcn },
  settings,
}

/** The guardrails. Every rule is an error: a silent break is the thing to avoid. */
const recommended = [
  { ...base, name: "tecton/recommended", rules: scopedRules },
]

/**
 * `recommended` plus the theme rules, still on Tecton components only, for
 * teams that want the full check on every class the component contract lets
 * through.
 *
 * Requires the Tecton stylesheet to resolve to a path **outside `node_modules`**.
 * The linter does not read theme sources from inside `node_modules`, so with an
 * ordinary registry install it sees an empty theme and reports every valid
 * Tecton class — `bg-blue-120` included — as a raw colour. Use this only where
 * `components.json`'s `tailwind.css` reaches the stylesheet outside
 * `node_modules`: a workspace package, or a vendored copy.
 *
 * `recommended` has no such dependency and is correct in every layout.
 */
const strict = [
  { ...base, name: "tecton/strict", rules: { ...scopedRules, ...themeRules } },
]

/**
 * `strict` widened to every `className` and `style` in the project, for teams
 * that want their own components held to the Tecton theme as well.
 *
 * This is the one preset that reports code the design system does not own, so
 * it is never what a team gets by default: adopt it deliberately, and expect
 * findings on plain markup. It carries the same `node_modules` dependency as
 * `strict`.
 */
const project = [
  {
    ...base,
    name: "tecton/project",
    rules: { ...scopedRules, ...projectRules },
  },
]

/**
 * Same rules as warnings, for adopting the guardrails in an existing codebase
 * without blocking CI on day one. Move to `recommended` once the backlog is
 * cleared.
 */
const warn = [
  {
    ...recommended[0],
    name: "tecton/warn",
    rules: Object.fromEntries(
      Object.entries(recommended[0].rules).map(([rule, value]) => [
        rule,
        Array.isArray(value) ? ["warn", ...value.slice(1)] : "warn",
      ])
    ),
  },
]

export default {
  configs: { recommended, strict, project, warn },
  plugin: shadcn,
  settings,
}
export { recommended, strict, project, warn, shadcn as plugin, settings }
