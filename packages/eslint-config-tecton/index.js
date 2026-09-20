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
 *
 * Split in two because a handful of parts own one half and not the other —
 * `ScrollArea` has no padding of its own but does need a height from the
 * caller, `AppShellMain` is the opposite. `variantOwned` is still the global
 * deny passed to the rule; the split only matters to the contracts below,
 * each of which repeats the half it still owns.
 */
const sizeOwned = ["h-*", "min-h-*", "max-h-*", "size-*"]
const paddingOwned = [
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
const variantOwned = [...sizeOwned, ...paddingOwned]

/** Composition utilities an application legitimately needs. */
const allowed = ["layout", "position", "spacing"]

/**
 * Stock Tailwind steps and families that are not Tecton steps or families.
 * Tecton's contrast ramp is 50 100 105 110 115 120 130 140 160 190 220 260
 * 310 370 460 560 680 830 1000 1170 1300 1440 1570; its families are lime
 * gray lilac saffron mauve red yellow orchid pink violet graphite lemon
 * azure blue green. Used only where a contract hands colour to the
 * application (`AvatarBadge`, `Spinner`): the class-group deny that keeps
 * shape and padding out cannot also catch `bg-green-500`, because a real
 * Tecton value lives in the same group, so the stock steps and families are
 * denied by name instead.
 */
const STOCK_STEPS = [
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
]
const STOCK_FAMILIES = [
  "slate",
  "zinc",
  "neutral",
  "stone",
  "orange",
  "amber",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "indigo",
  "purple",
  "fuchsia",
  "rose",
]
const stock = (prefix) => [
  ...STOCK_STEPS.map((s) => `${prefix}-*-${s}`),
  ...STOCK_FAMILIES.map((f) => `${prefix}-${f}-*`),
]

/**
 * Builds one `no-restyle` contract. The last contract whose `pattern` matches
 * a component wins, and a contract's `allow`/`deny` *replace* the top-level
 * ones rather than adding to them — so every contract repeats the base
 * `allowed` categories, and `deny` defaults to the full `variantOwned` (the
 * same value the rule already denies globally) unless the part owns only
 * half of it.
 *
 * These only ever *widen* the rule for a part whose box or frame belongs to
 * the application by design — a viewport with no height of its own, a divider
 * the source already prices into its padding, a scoping root. They never
 * narrow it: nothing here removes protection `no-restyle` would otherwise
 * give a component.
 */
const contract = (
  pattern,
  { allow = [], deny = variantOwned, message } = {}
) => ({
  pattern,
  allow: [...allowed, ...allow],
  deny,
  ...(message ? { message } : {}),
})

const stockColor =
  '"{{className}}" is a stock Tailwind colour: the Tecton palette is reset, so it emits no CSS. ' +
  "Use a palette step (bg-green-560) or a semantic token (bg-primary, text-muted-foreground)."

/**
 * Per-component widenings of `no-restyle`, verified against the real linter.
 * Each is grounded in the component's usage guideline
 * (`packages/tecton-react/guidelines/*.md`) and in the source it documents;
 * `scripts/guidelines.mjs` lints every guideline's `Correct:` example against
 * this list so the two cannot drift apart.
 */
const contracts = [
  // A viewport with no height and no frame of its own: guidelines/scroll-area.md
  // and guidelines/resizable.md both size the box from outside (`h-72 w-48
  // rounded-md border`) and put padding on an inner wrapper, so shape is
  // theirs to take but padding stays denied.
  contract("^(ScrollArea|ResizablePanelGroup)$", {
    allow: ["shape"],
    deny: paddingOwned,
  }),
  // Height from outside, everything else owned: the `ResponsiveContainer`
  // inside ChartContainer measures its parent (guidelines/chart.md), a
  // vertical CarouselContent needs a height class (guidelines/carousel.md),
  // Canvas and Panel take the height of the column they sit in
  // (guidelines/canvas.md, guidelines/panel.md), MessageScroller is the
  // flex-1 child of a constrained parent (guidelines/message-scroller.md), a
  // vertical Slider needs `h-40` (guidelines/slider.md), and an embedded
  // AppShell is overridden with `h-full` (guidelines/app-shell.md).
  contract(
    "^(ChartContainer|CarouselContent|Canvas|Panel|MessageScroller|Slider|AppShell)$",
    {
      deny: paddingOwned,
    }
  ),
  // guidelines/app-shell.md: inside a resizable split the aside still draws
  // its own left border, doubling the handle, so the guideline turns it off
  // with `border-l-0`.
  contract("^AppShellAside$", { allow: ["border-l-0"], deny: paddingOwned }),
  // guidelines/app-shell.md: the scrolling work area takes the page inset
  // (`p-6`) — height is the shell's, not AppShellMain's.
  contract("^AppShellMain$", { deny: sizeOwned }),
  // guidelines/empty.md (`min-h-64 border`, the component already carries
  // `border-dashed`) and guidelines/skeleton.md, where sizing IS the API
  // (`h-4 w-full`, `size-12 rounded-full`) — colour stays the component's.
  contract("^(Empty|Skeleton)$", { allow: ["shape"], deny: paddingOwned }),
  // guidelines/accordion.md: `className` is width and frame only (`max-w-lg
  // border`); the heading, trigger and chevron are the parts' own.
  contract("^Accordion$", { allow: ["shape"] }),
  // guidelines/aspect-ratio.md: an unstyled ratio box — radius and the
  // `bg-muted` placeholder tone are meant to show while the media loads.
  contract("^AspectRatio$", { allow: ["shape", "bg-muted"] }),
  // guidelines/spinner.md: an svg icon, sized and coloured like one
  // (`size-5 text-muted-foreground`). Stock steps and families are still
  // denied by name, so `text-gray-500` is caught even though the colour
  // category is open.
  contract("^Spinner$", {
    allow: ["text-color"],
    deny: [...paddingOwned, ...stock("text")],
    message: { color: stockColor },
  }),
  // guidelines/avatar.md: the one avatar part whose colour the application
  // picks (`bg-green-560`). Same stock-name denial as Spinner.
  contract("^AvatarBadge$", {
    allow: ["bg-color"],
    deny: [...variantOwned, ...stock("bg")],
    message: { color: stockColor },
  }),
  // guidelines/table.md: emphasis of a key column (`font-medium`,
  // `tabular-nums`, `truncate`) — size and colour stay the table's.
  contract("^(TableCell|TableHead)$", {
    allow: ["font-weight", "fvn-spacing", "text-overflow"],
  }),
  // guidelines/card.md: the divider the source already prices into its
  // padding (`[.border-b]:pb-(--card-spacing)`), so a bare `border-b` picks
  // up the themed colour and the right spacing for free.
  contract("^CardHeader$", { allow: ["border-b"] }),
  // guidelines/card.md, the footer half of the same divider
  // (`[.border-t]:pt-(--card-spacing)`).
  contract("^CardFooter$", { allow: ["border-t"] }),
  // guidelines/field.md: a layout group with no padding of its own — a Sheet
  // body gives it `px-4`.
  contract("^FieldGroup$", { deny: sizeOwned }),
  // guidelines/theme-root.md: the scope root of a mounted micro-frontend.
  // Its `className` is a scoping hook (`mfe-a`) mirrored onto the overlay
  // container it owns, not a style surface, so anything goes.
  contract("^ThemeRoot$", { allow: ["*"], deny: [] }),
  // guidelines/button.md: the docs' "Rounded" example and the Tecton FAB
  // recipe (`rounded-full shadow-md`). Heights stay denied — the extended
  // FAB's `h-10` is still an error by design; the right fix is a Button size
  // in the overlay, not a lint exception.
  contract("^(Button|LinkButton)$", { allow: ["rounded-full", "shadow"] }),
  // guidelines/marker.md and docs/utils/shimmer: the shimmer utility the
  // Tecton stylesheet declares for streaming text.
  contract("^MarkerContent$", { allow: ["shimmer"] }),
]

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
  "shadcn/no-restyle": [
    "error",
    { allow: allowed, deny: variantOwned, contracts },
  ],
  "shadcn/require-static-classes": "error",
  "no-restricted-imports": ["error", restrictedImports],
}

/**
 * Rules that validate every `className` in the project, not just Tecton
 * components. They catch real breakage — `bg-red-500` generates no CSS
 * anywhere, including in an application's own component — but they police code
 * the design system does not own, so they are opt-in through `strict`.
 */
const projectRules = {
  "shadcn/no-raw-colors": ["error", { message: messages.rawColor }],
  "shadcn/no-unknown-classes": ["error", { message: messages.unknown }],
  "shadcn/no-arbitrary-values": ["error", { message: messages.arbitrary }],
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
  {
    ...base,
    name: "tecton/strict",
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
  configs: { recommended, strict, warn },
  plugin: shadcn,
  settings,
}
export { recommended, strict, warn, shadcn as plugin, settings }
