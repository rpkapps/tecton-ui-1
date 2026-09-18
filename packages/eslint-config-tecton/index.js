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
 * Components installed from a public registry into `components/ui/`. Tecton
 * ships its components inside the package, so a file there means the registry
 * CLI was run without the `@tecton/` namespace and copied in an unthemed
 * component with a palette Tecton removes — it will render unstyled.
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
        "Not a Tecton component: files under components/ui/ come from a public registry and are not themed. Import from @tecton/react/components/<name>. Only blocks are copied in, and only from the @tecton registry.",
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
  "tecton/no-restyle": ["error", { allow: allowed, deny: variantOwned }],
  "tecton/require-static-classes": "error",
  "no-restricted-imports": ["error", restrictedImports],
}

/**
 * Rules that validate every `className` in the project, not just Tecton
 * components. They catch real breakage — `bg-red-500` generates no CSS
 * anywhere, including in an application's own component — but they police code
 * the design system does not own, so they are opt-in through `strict`.
 */
const projectRules = {
  "tecton/no-raw-colors": ["error", { message: messages.rawColor }],
  "tecton/no-unknown-classes": ["error", { message: messages.unknown }],
  "tecton/no-arbitrary-values": ["error", { message: messages.arbitrary }],
  "tecton/no-inline-styles": "error",
}

/**
 * The rules are Tecton's guardrails as far as an application is concerned, so
 * they are reported under a `tecton/` prefix: `tecton/no-restyle`, not the
 * underlying plugin's own name. The plugin stays registered under its original
 * key as well, so an `eslint-disable` or an override written against the old
 * ids keeps resolving.
 */
const base = {
  files: ["**/*.{js,jsx,ts,tsx}"],
  plugins: { tecton: shadcn, shadcn },
  settings,
}

/** The guardrails. Every rule is an error: a silent break is the thing to avoid. */
const recommended = [{ ...base, name: "tecton/recommended", rules: scopedRules }]

/**
 * `recommended` plus the project-wide theme rules, for teams that want every
 * class in the application checked against the Tecton theme.
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
  { ...base, name: "tecton/strict", rules: { ...scopedRules, ...projectRules } },
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

export default { configs: { recommended, strict, warn }, plugin: shadcn, settings }
export { recommended, strict, warn, shadcn as plugin, settings }
