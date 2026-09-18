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

/** The guardrails. Every rule is an error: a silent break is the thing to avoid. */
const recommended = [
  {
    name: "tecton/recommended",
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { shadcn },
    settings,
    rules: {
      "shadcn/no-restyle": ["error", { allow: allowed, deny: variantOwned }],
      "shadcn/no-raw-colors": "error",
      "shadcn/no-unknown-classes": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-inline-styles": "error",
      "shadcn/require-static-classes": "error",
      "no-restricted-imports": ["error", restrictedImports],
    },
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

export default { configs: { recommended, warn }, plugin: shadcn, settings }
export { recommended, warn, shadcn as plugin, settings }
