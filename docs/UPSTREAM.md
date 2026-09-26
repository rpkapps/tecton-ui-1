# Upstream shadcn/ui pin

Every file under `packages/tecton-react/src/components/**`, `src/hooks/**`, `src/lib/**` and the
scaffold of `src/styles/globals.css` is produced by the shadcn CLI, never by hand.

- Repository: https://github.com/shadcn-ui/ui
- Commit: `3ba91b1cc83e1bbe4ab35a422ff2a694849c5048` (main, 2026-09-12)
- CLI: `shadcn@4.21.0` (built from the same commit, `packages/shadcn`)
- Base / style: `base` (Base UI) / `tecton` → registry style `base-tecton`
- `components.json` (`packages/tecton-react` and `apps/www`): `"style": "base-tecton"`, `"rtl": true`
- Runtime package: `shadcn@^4.21.0` (`@import "shadcn/tailwind.css"`)

`scripts/registry-mirror.sh` and CI read the commit from the `- Commit:` line above.

## The `base-tecton` style

Upstream authors every preset as a CSS file of `@apply` lists
(`apps/v4/registry/styles/style-<name>.css`); the registry build inlines those classes into the
component sources of each base (`apps/v4/registry/bases/<base>/ui/*.tsx`). Tecton is one more
preset, built from `scripts/registry-mirror/overlay/` for the `base` base only:

| File | What it is |
| --- | --- |
| `style-tecton.css` | `style-vega.css` with the Tecton deviations: solid 2px focus ring (`ring-2 ring-ring`), flat controls (no `shadow-xs`), buttons that lighten on hover / press (`:active`, since Base UI's Button sets no press attribute), Tecton tab and toggle colours, and the class lists of the extra variants |
| `tecton.patch` | Registers the style in `registry/styles.tsx` and patches `registry/bases/base/ui/*` (see [Overlay hunks](#overlay-hunks)) |

`scripts/registry-mirror.sh build` resets every file under `registry/bases` and
`registry/styles.tsx` that differs from the pin (plus every file the patch names), re-applies the
patch with `git apply --3way` (piped through `tr -d '\r'`, so a CRLF checkout applies too) and
builds only `base-tecton` (`SHADCN_STYLE` overrides it). `export` writes the differing files back
into `tecton.patch`, so patching a new base source needs no script change.

After the build, `build` fails if a `cn-*` class survived into `public/r/styles/base-tecton/*.json`:
the build inlines a style's classes only into a `className` or a `cva()`, so a survivor reaches the
component raw and has no CSS. Upstream's `ALLOWLIST` (`packages/shadcn/src/styles/transform-style-map.ts`,
read from the pinned source) is exempt; the CLI resolves those at install time.

Because the style exists nowhere else, **every CLI command that touches `packages/tecton-react`
runs against the mirror** (`REGISTRY_URL=http://127.0.0.1:4000/r`).

## How the files were generated

```bash
# 1. Registry mirror with the Tecton overlay
scripts/registry-mirror.sh setup        # clone (or reset) at the pin, install, overlay, build
scripts/registry-mirror.sh serve &      # http://127.0.0.1:4000
export REGISTRY_URL=http://127.0.0.1:4000/r

# 2. Scaffold (once, in an empty directory, then moved into this repo). The project was
#    scaffolded on the aria base and moved to base by switching components.json and re-adding
#    every item.
pnpm dlx shadcn@4.21.0 init --template start --monorepo --base aria --preset vega --name tecton-ui-1
#    packages/ui -> packages/tecton-react (@tecton/react), apps/web -> apps/www
#    components.json: "style": "base-tecton", "rtl": true

# 3. All 59 UI items (with dist/ absent), then the directives
pnpm dlx shadcn@4.21.0 add accordion alert alert-dialog aspect-ratio attachment avatar badge \
  breadcrumb bubble button button-group calendar card carousel chart checkbox collapsible \
  combobox command context-menu dialog direction drawer dropdown-menu empty field hover-card \
  input input-group input-otp item kbd label marker message message-scroller native-select \
  pagination popover progress questionnaire radio-group resizable scroll-area select separator \
  sheet sidebar skeleton slider sonner spinner switch table tabs textarea toggle toggle-group \
  tooltip --overwrite -c packages/tecton-react
pnpm --filter @tecton/react use-client:restore
```

The items also install `src/hooks/use-mobile.ts` (`sidebar`) and `src/lib/utils.ts`. `add --all`
is not used: the `base` registry also has `menubar`, `navigation-menu` and `toast`, which Tecton
does not ship.

`"rtl": true` makes the CLI rewrite physical classes to logical ones at install time (`ml-` →
`ms-`, `left-` → `start-`, `rounded-l-` → `rounded-s-`, `side="right"` → `side="inline-end"`, …);
only classes keyed on an explicit side (`data-[side=left|right]` on sidebar and sheet) stay
physical. `pnpm generated:check` uses the same setting.

## Updating

```bash
export REGISTRY_URL=http://127.0.0.1:4000/r
pnpm dlx shadcn@4.21.0 add button --diff button.tsx -c packages/tecton-react   # preview
pnpm dlx shadcn@4.21.0 add button --overwrite -c packages/tecton-react          # apply
pnpm --filter @tecton/react use-client:restore                                  # see below
pnpm tokens:build                                                               # re-apply Tecton variables
pnpm generated:check                                                            # nothing hand-edited
```

Run the CLI with `packages/tecton-react/dist/` **absent**: otherwise it resolves the
`@tecton/react/...` aliases to the emitted declarations and rewrites self-imports to
`@tecton/react/dist/components/button.d` (`rm -rf packages/tecton-react/dist` and re-add to undo).

**Changing the style.** Edit `overlay/style-tecton.css` (or a base source in the mirror clone, then
`scripts/registry-mirror.sh export`), run `scripts/registry-mirror.sh build`, restart `serve`,
re-add the affected items with `--overwrite` and run `pnpm generated:check`.

**Bumping upstream.**

1. Update the commit above and run `scripts/registry-mirror.sh setup`. `setup` resets the clone
   (`reset --hard`, `clean -fd`, forced checkout), so `export` uncommitted edits first. CI caches
   the clone in `.cache/shadcn-ui` keyed on the commit. If upstream changed `style-vega.css`, port
   the change into `style-tecton.css` (`git diff <old>..<new> -- apps/v4/registry/styles/style-vega.css`
   in the clone); if `tecton.patch` conflicts, resolve it in the clone and `export`.
2. `scripts/registry-mirror.sh build`, re-add all 59 items with `--overwrite`, `pnpm tokens:build`,
   `pnpm generated:check`, `pnpm docs:sync`, `pnpm typecheck`.

## Docs pages and examples

`apps/www/content/docs/components/*.mdx` and the examples in `apps/www/src/examples/*.tsx` whose
first line is `// Synced from shadcn/ui …` are synced from the same commit
(`apps/v4/content/docs/components/base/*.mdx`, `apps/v4/examples/base/*.tsx`) by `pnpm docs:sync`
(`apps/www/scripts/sync-upstream-docs.mts`, `SHADCN_UPSTREAM_DIR` defaults to `.cache/shadcn-ui`),
with imports rewritten to `@tecton/react/...`. The `base` docs cover `toast` instead of `sonner`,
so the sonner page and examples come from the `radix` base (they only call `toast()` from a
Button's `onClick`); the `direction` page is not synced (applications set the direction with
`TectonProvider`). Tecton sections of a synced page come from `apps/www/scripts/docs-extras/<name>.mdx`,
inserted before the upstream "API Reference". Consumers never see the libraries under the
components: the sync drops Base UI `links` from the frontmatter, the "See the Base UI
documentation" sentences (and an emptied "API Reference"), library callouts and "Migrating from …"
sections (`stripLibraryReferences`), and fails, naming file and line, if a page or synced example
still says Base UI, React Aria or Radix (`assertNoLibraryNames`). Skipped examples are listed in
`apps/www/scripts/sync-report.json`. The synced content keeps shadcn/ui's MIT license.

## The `dark:` variant

The CLI writes `@custom-variant dark (&:is(.dark *));` into `globals.css` from a string hard-coded
in the CLI, and only when the file has no `@custom-variant` yet; no registry item owns the line. It
is therefore the CLI's to *create* and `scripts/tokens-build.mts`'s to keep correct: Tecton needs a
variant that can leave a dark subtree again (`<div class="light">` in a dark page,
`<ThemeRoot theme="light">` in a dark shell). `DARK_VARIANT` in `tokens-build.mts` is the single
source; it is written into `globals.css` and `scoped.css`, and `tokens:check` fails if the two
differ or the stock line reappears. `scripts/generated-check.sh` does not look at `globals.css`.

## The light block

The CLI writes the shadcn variables in `:root` and `.dark`, and `.dark` repeats every declaration
because a custom property inherits with its `var()` already substituted. Nothing does that for an
inverted *light* section, which would inherit `--background`, `--primary`, … already resolved to
the dark values and render half dark. So `tokens-build.mts` rebuilds a `.light, [data-theme="light"]`
block from the patched `:root` on every run and places it right after `.dark` (same specificity,
source order decides). The block is also written into `tecton-theme.css` and into
`registry/theme.json` under `css` (the CLI maps `cssVars` keys only to `:root`, `.dark` or `.<key>`),
together with the Tecton `dark` variant, which must follow the CLI's stock line because Tailwind
takes the last definition. `tokens:check` fails if the light block stops mirroring `:root`, moves
before `.dark`, or either copy drifts.

## `"use client"`

With `rsc: false` the CLI's `transformRsc` (`packages/shadcn/src/utils/transformers/transform-rsc.ts`)
tests a module-level `/g` regex, whose `lastIndex` survives between files, so one `shadcn add` run
removes the directive from every other file it writes. `@tecton/react` is a client component
library, so every file whose base source is marked `"use client"` must keep it. After every
`shadcn add`:

```bash
pnpm --filter @tecton/react use-client:restore   # copies the directive back from the mirror clone
pnpm --filter @tecton/react use-client:check     # same, fails instead of writing (CI)
```

`scripts/restore-use-client.mts` compares each component with the base source in the mirror clone
(`apps/v4/registry/bases/base/ui`), only ever adds the directive and keeps line endings; 37 of the
59 items carry it.

The same quirk makes `shadcn add … --diff` and `--overwrite` disagree on the directive, so
`scripts/generated-check.sh` (which runs `add <item> --diff <file>` for every file under
`src/components`, `src/hooks` and `src/lib`, hooks and lib mapped in `item_for_support_file`)
tolerates exactly one thing: diff lines that are blank or only the directive. Any other diff line,
an unrecognised or missing file header, an `(overwrite)` with no diff, or a CLI error fails the
check. It runs with `NO_COLOR=1` and strips escape sequences.

## Overlay hunks

`tecton.patch` registers the `tecton` style in `apps/v4/registry/styles.tsx`; every other hunk is on
`apps/v4/registry/bases/base/ui/*`. Behaviour hunks are tested in
`src/tecton/__tests__/overlay-behaviour.test.tsx` unless noted.

- **Portal target** (`alert-dialog`, `dialog`, `sheet`, `drawer`, `popover`, `tooltip`,
  `hover-card`, `select`, `combobox`, `dropdown-menu`, `context-menu`) — every overlay portals
  into `container ?? usePortalTarget()` (`@tecton/react/tecton/portal`, fed by `TectonProvider`'s
  `portalContainer`), so a `container` the caller passes wins. The `*Portal` wrappers take it, and
  every content part gains an optional `container` (`DialogContent`, `AlertDialogContent`,
  `SheetContent`, `DrawerContent` through their `*Portal`; `PopoverContent`, `TooltipContent`,
  `HoverCardContent`, `SelectContent`, `ComboboxContent`, `DropdownMenuContent`,
  `ContextMenuContent` and their `*SubContent` directly). `usePortalTarget()` is never `null`,
  which Base UI would read as "render nothing". Tested in
  `src/tecton/__tests__/overlay-portal-container.test.tsx`.
- **Variant axes** — `alert` (`variant` success / warning / info, `appearance` default / outline /
  filled, exposed as `data-variant` / `data-appearance`; `alertVariants` exported), `badge`
  (`variant` success / warning / info, `appearance` solid / outline, `size` default / md / lg,
  exposed as `data-appearance` / `data-size`; 2px focus ring), `separator` (`emphasis` subtle /
  default / strong, `data-emphasis`, `separatorVariants`), `input` / `textarea` / `select` trigger
  (`variant` outline / filled / text, `data-variant`; `inputVariants`, `textareaVariants`,
  `selectTriggerVariants`). The `select` trigger variants and the `input-otp` container are pinned
  in `src/tecton/__tests__/overlay-variants.test.tsx`.
- **`button`** — renders `data-variant` / `data-size` (as the other bases do), which the
  `button-group` rule in `style-tecton.css` keys on to give filled members the outline stroke when
  the group has an outlined member.
- **`button-group`** — logical corners (`rounded-e-none` / `rounded-s-none`); members overlap by a
  pixel (`-ms-px` / `-mt-px`) instead of dropping a border, so each draws a complete ring.
- **`tabs`** — the hard-coded active-tab colours, indicator colour and 3px ring are removed so
  `style-tecton.css` sets the Tecton ones (2px ring); the default tab list sits on `bg-card`.
  `Tabs` passes its `orientation` to the Base UI root (upstream only sets `data-orientation`, so
  vertical tabs kept horizontal arrow keys and `aria-orientation`). `TabsList` defaults
  `activateOnFocus` to `true`: an arrow key selects the tab it moves to, as the React Aria-based
  Tecton did (Base UI defaults to manual activation; `false` restores it).
- **`toggle`** — the base `hover:bg-muted` is removed so `style-tecton.css` sets the Tecton ghost
  hover colours; 2px focus ring.
- **`alert-dialog`** — `AlertDialogAction` renders the Base UI `Close` part with `Button` styling
  (`variant` / `size`, like `AlertDialogCancel`), so a click runs `onClick` and closes the prompt;
  `event.preventBaseUIHandler()` in `onClick` keeps it open.
- **`sidebar`** — `side` is physical, so the container border (`ltr:` / `rtl:` pairs of logical
  borders), the rail's offcanvas position and resize cursors (`group-data-[side=…]` variants and
  arbitrary cursor values, which the CLI's RTL transform leaves alone) stay on the same physical
  edge in both directions; `SidebarMenuButton` opens its collapsed tooltip away from the sidebar's
  side (a `SidebarSideContext` set by `Sidebar`) instead of a hard-coded `right`.
  `SidebarProvider` gains `cookieName?: string | false` (default `"sidebar_state"`), so several
  micro frontends on one page do not share one cookie (tested in
  `src/tecton/__tests__/sidebar-provider.test.tsx`). Upstream's `window` keydown listener for
  ⌘B / Ctrl+B (`SIDEBAR_KEYBOARD_SHORTCUT`) is removed: Tecton registers no keyboard shortcuts, and
  an application that wants one calls `toggleSidebar()` from `useSidebar()` in its own handler.
- **`slider`** — the thumb (a `div`) uses `data-disabled:pointer-events-none` instead of
  `disabled:`, which never matched. `aria-label` on `Slider` is passed to every thumb's range input
  instead of the group root (Base UI forwards only `aria-labelledby`), so `<Slider aria-label="…">`
  names the thumbs as the React Aria-based slider did.
- **`input-otp`, `calendar`** — classes upstream passes outside a `className` (`containerClassName`,
  DayPicker `classNames`) move into a `cva` (`inputOTPContainerVariants`,
  `calendarDropdownRootVariants`, `calendarCaptionLabelVariants`) so the build inlines them.
- **`calendar`** — the DayPicker `components` (`Root`, `Chevron`, `DayButton`, `WeekNumber`) are
  memoised on `locale` and `components`: upstream builds them inline, so every render gave DayPicker
  new component types and it remounted the grid, which dropped focus on each click and arrow key.
  `CalendarDayButton` passes its `ref` to the `Button` (upstream's `base` version drops it, so the
  day DayPicker marks focused never got DOM focus and the arrow keys did nothing).
  The month dropdown and the day buttons' `data-day` format with `calendar: "gregory"`, since some
  locales (`ar-SA`) default to a non-Gregorian calendar in `Intl` and named the wrong months (and
  differed between server and browser, a hydration mismatch).
- **`pagination`** — `PaginationLink` is a plain `a` with `buttonVariants`: a Base UI `Button`
  rendering an `a` keeps `role="button"`, so the page links were announced as buttons.
- **`sonner`** — `richColors` and outlined status colours (`--success-*`, `--info-*`,
  `--warning-*`, `--error-*`), matching `alert` with `appearance="outline"`; upstream's
  `toastOptions` class (`cn-toast`, outside a `className`) goes.

## Renaming the package

`bun run scripts/rename-package.mts <new-name> --dry-run` previews the per-category counts of the
`@tecton/react` literal (self-imports, `src/tecton`, blocks, examples, docs, config, the overlay);
without `--dry-run`, on a clean tree, it rewrites them and prints the follow-up checklist (install,
rebuild the mirror and re-add every item, `use-client:restore`, `generated-check.sh`, the
`icons:build` / `tokens:build` / `exports:build` / `agent:build` / `registry:build` / `docs:sync`
rebuilds, then typecheck, test, lint). It skips generated output (`pnpm-lock.yaml`,
`apps/www/public/r/**`, `packages/tecton-blocks/registry.json`, `docs/TOKEN-MAPPING.md`,
`packages/tecton-react/agent/**`), rewrites only added lines in `tecton.patch` (re-verify with
`registry-mirror.sh build`) and leaves the registry namespace `@tecton` untouched.

## Build output

`pnpm --filter @tecton/react build` (`scripts/build.mts`; also run by `prepack`, `build:lib` and
`typecheck`) writes `dist/`, which is what the package publishes (`src/` is not shipped). It is
**unbundled**: one `.js` + `.js.map` (sources embedded) + `.d.ts` per module.

- **JS** — esbuild with every specifier external, so each file keeps its `"use client"` and its
  `@tecton/react/...` self-imports; relative imports gain `.js`.
- **`.d.ts`** — `tsconfig.build.json` through the TypeScript API, `paths` kept so declarations
  name `@tecton/react/...`. `KNOWN_DTS_FAILURES` in `build.mts` is empty: a declaration error is
  fixed in the overlay, not waived.
- **CSS** — `src/styles/*.css` copied with every `@source` collapsed into `@source "../**/*.js";`.

The `exports` map in `package.json` is generated by `exports:build` (one entry per module, pointing
at `dist/`); `exports:check` fails in CI when it is stale. There is no `"."` entry on purpose: the
micro-frontend setup shares the `@tecton/react/` prefix.
