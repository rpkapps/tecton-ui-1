# Upstream shadcn/ui pin

Every generated file under `packages/tecton-react/src/components/**`,
`src/hooks/**`, `src/lib/**` and the scaffold of `packages/tecton-react/src/styles/globals.css`
was produced by the shadcn CLI, never by hand.

- Repository: https://github.com/shadcn-ui/ui
- Commit: `3ba91b1cc83e1bbe4ab35a422ff2a694849c5048` (main, 2026-09-12)
- CLI: `shadcn@4.21.0` (built from the same commit, `packages/shadcn`)
- Base / style: `base` (Base UI, `@base-ui/react`) / `tecton` → registry style `base-tecton` (see below)
- Template: `start-monorepo` (`shadcn init --template start --monorepo --base aria --preset vega`;
  the project moved to the `base` base afterwards by switching `components.json` and re-adding every item)
- `components.json`: `"style": "base-tecton"`, `"rtl": true` (both `packages/tecton-react` and `apps/www`)
- Runtime package: `shadcn@^4.21.0` (`@import "shadcn/tailwind.css"`)

## The `base-tecton` style (registry overlay)

Upstream authors every preset as a CSS file of `@apply` lists
(`apps/v4/registry/styles/style-<name>.css`); the registry build crosses every base with every
style and inlines those Tailwind classes into the component sources
(`apps/v4/registry/bases/<base>/ui/*.tsx`). Tecton is one more preset built the same way, from the
overlay in `scripts/registry-mirror/overlay/`, and is built for the `base` base only:

| File | What it is |
| --- | --- |
| `style-tecton.css` | Copy of `style-vega.css` with the Tecton deviations: solid 2px focus ring (`ring-2 ring-ring`), flat controls (no `shadow-xs`), buttons that lighten on hover / press, and the class lists of the extra variants below. The shared `cn-*` classes key on Base UI state (`:active` for a press — Base UI's Button sets no press attribute —, `data-active` on a tab, `has-focus-visible` on the slider thumb, whose focus is on the hidden input); the `cn-*-aria` classes stay as in vega and are unused |
| `tecton.patch` | Registers the style in `registry/styles.tsx` and patches `registry/bases/base/ui/*` (see "Overlay hunks" below): the Tecton portal target on every overlay; variant axes on `alert` (`variant` success/warning/info + `appearance` default/outline/filled), `badge` (`variant` success/warning/info + `appearance` solid/outline + `size` default/md/lg), `separator` (`emphasis` subtle/default/strong), `input` / `textarea` / `select` trigger (`variant` outline/filled/text, `cva`s exported as `inputVariants`, `textareaVariants`, `selectTriggerVariants`); hard-coded colours stripped from `tabs` and `toggle` so the style file sets the Tecton ones; logical corners on `button-group`; outlined status colours on `sonner`; and `cva`s where the build would otherwise leave a `cn-*` class raw (`input-otp`, `calendar`) |

`scripts/registry-mirror.sh build` re-applies the overlay (`git apply --3way`) and builds only
`base-tecton` (`SHADCN_STYLE` overrides it). The files the overlay touches are derived, not listed in the script: before
applying, `build` resets every file under `OVERLAY_PATHSPEC` (`registry/bases`, `registry/styles.tsx`)
that differs from the pinned commit, plus every file `tecton.patch` names, and `export` writes back
whatever differs there, so patching a new base source needs no edit to the script. The patch is piped through `tr -d '\r'` first: `--3way` matches it against the
clone's index blobs, which are always LF, so a CRLF working copy of `tecton.patch`
(`core.autocrlf` on Windows) would otherwise fail to apply on every file. Because the style exists nowhere else, **every CLI command that touches
`packages/tecton-react` runs against the mirror** (`REGISTRY_URL=http://127.0.0.1:4000/r`), and
`pnpm generated:check` diffs the installed files against what the mirror serves.

After the registry build, `build` fails if any `cn-*` class survived into the built
`public/r/styles/base-tecton/*.json`. The registry build inlines a style's classes only into a
`className` or a `cva()`, so a survivor is a class that reaches the generated component raw and has
no CSS (a variant map that is not a `cva`, a class in `containerClassName`, `toastOptions` or
DayPicker's `classNames`). The
exceptions are upstream's `ALLOWLIST` in `packages/shadcn/src/styles/transform-style-map.ts`
(`cn-menu-target`, `cn-rtl-flip`, …), which the build keeps on purpose and the CLI resolves at
install time; the script reads that list from the pinned source, so an upstream bump keeps it in
step (if it cannot be found, every survivor is reported).

## How the files were generated

```bash
# 1. Registry mirror with the Tecton overlay
scripts/registry-mirror.sh setup        # clone (or reset the clone) at the pinned commit, install, overlay, build
scripts/registry-mirror.sh serve &      # http://127.0.0.1:4000
export REGISTRY_URL=http://127.0.0.1:4000/r

# 2. Scaffold (run once, in an empty directory, then moved into this repo)
pnpm dlx shadcn@4.21.0 init --template start --monorepo --base aria --preset vega --name tecton-ui-1
#    packages/ui -> packages/tecton-react (@tecton/react), apps/web -> apps/www (config edits only)
#    components.json: "style": "base-tecton", "rtl": true

# 3. All 59 UI items (dist/ absent), then the directives
pnpm dlx shadcn@4.21.0 add accordion alert alert-dialog aspect-ratio attachment avatar badge \
  breadcrumb bubble button button-group calendar card carousel chart checkbox collapsible \
  combobox command context-menu dialog direction drawer dropdown-menu empty field hover-card \
  input input-group input-otp item kbd label marker message message-scroller native-select \
  pagination popover progress questionnaire radio-group resizable scroll-area select separator \
  sheet sidebar skeleton slider sonner spinner switch table tabs textarea toggle toggle-group \
  tooltip --overwrite -c packages/tecton-react
pnpm --filter @tecton/react use-client:restore
```

The items also install `src/hooks/use-mobile.ts` (`sidebar`) and `src/lib/utils.ts` (`utils`).
`add --all` is not used on purpose: the `base` registry also has `menubar`, `navigation-menu` and
`toast`, which Tecton does not ship.

`"rtl": true` makes the CLI's `transform-rtl` rewrite physical classes to logical ones at install
time (`ml-`/`pl-`/`left-`/`rounded-l-`/`text-left` → `ms-`/`ps-`/`start-`/`rounded-s-`/`text-start`,
`side="right"` → `side="inline-end"`, `data-[side=left]` → `data-[side=inline-start]`); only classes
keyed on an explicit physical side (the sidebar's and sheet's `data-[side=left|right]`) stay
physical. `pnpm generated:check` runs with the same setting, so the output round-trips.

## Updating

```bash
export REGISTRY_URL=http://127.0.0.1:4000/r
pnpm dlx shadcn@4.21.0 add button --diff button.tsx -c packages/tecton-react   # preview
pnpm dlx shadcn@4.21.0 add button --overwrite -c packages/tecton-react          # apply
pnpm --filter @tecton/react use-client:restore                                  # put back the dropped directives
pnpm tokens:build                                                               # re-apply Tecton variables
pnpm generated:check                                                            # confirm nothing was hand-edited
```

Run the CLI with `packages/tecton-react/dist/` **absent**. When a build is lying around, the CLI
resolves the `@tecton/react/...` aliases to the emitted declarations and rewrites the generated
components' self-imports to `@tecton/react/dist/components/button.d`; `rm -rf packages/tecton-react/dist`
and re-add to undo it.

### Changing the Tecton style

Edit `scripts/registry-mirror/overlay/style-tecton.css` (or the base sources in the mirror
clone, then `scripts/registry-mirror.sh export` to refresh `tecton.patch`), run
`scripts/registry-mirror.sh build`, restart `serve`, then re-add the affected items with
`--overwrite` and run `pnpm generated:check`.

### Bumping upstream

1. Update the commit above and run `scripts/registry-mirror.sh setup`. `setup` resets an existing
   clone (`reset --hard`, `clean -fd`, then a forced checkout of the pin), so uncommitted edits in
   it are discarded: run `export` first to keep them. Ignored files (`node_modules`, builds)
   survive. (CI caches the mirror clone
   in `.cache/shadcn-ui` keyed on this commit, so the bump also starts a fresh clone there.) The overlay is applied with
   a 3-way merge: if upstream changed `style-vega.css`, port the change into `style-tecton.css`
   (`git diff <old>..<new> -- apps/v4/registry/styles/style-vega.css` in the mirror clone); if
   `tecton.patch` conflicts, resolve it in the clone and run `scripts/registry-mirror.sh export`.
2. `scripts/registry-mirror.sh build`, re-add all 59 items with `--overwrite`, `pnpm tokens:build`,
   `pnpm generated:check`, `pnpm --filter www docs:sync`, `pnpm typecheck`.

## Docs pages and examples

`apps/www/content/docs/components/*.mdx` and the examples in `apps/www/src/examples/*.tsx`
whose first line is `// Synced from shadcn/ui …` are synced from the same upstream commit
(`apps/v4/content/docs/components/aria/*.mdx`, `apps/v4/examples/aria/*.tsx`) by
`pnpm docs:sync` (`apps/www/scripts/sync-upstream-docs.mts`), with import paths rewritten to
`@tecton/react/...`. The Tecton sections of a synced page (the overlay variants) come from
`apps/www/scripts/docs-extras/<name>.mdx`, inserted before the upstream "API Reference".
shadcn/ui is MIT licensed (see `LICENSE.md` in the upstream repository);
the synced content keeps that license. Examples that need upstream-only infrastructure are
skipped and listed in `apps/www/scripts/sync-report.json`.

## The `dark:` variant

`packages/tecton-react/src/styles/globals.css` line 12 is **not** the CLI's to keep up to date.
The `add-custom-variant` transform the CLI runs while updating a Tailwind v4 CSS file writes
`@custom-variant dark (&:is(.dark *));` from a string hard-coded in the CLI itself
(`params: "dark (&:is(.dark *))"`, `updateCssVars`), and it is a **no-op as soon as the file holds
any `@custom-variant` at all**. Nothing in the registry owns the line either: the mirror overlay
patches component sources and `style-tecton.css`, and `registry/theme.json`'s `css` field carries
only the font imports and the scrollbar rule. `scripts/generated-check.sh` does not look at
`globals.css` — it diffs `src/components/*.tsx`, `src/hooks/*` and `src/lib/*`.

So the line is the CLI's to *create* and `scripts/tokens-build.mts`'s to keep correct, alongside
the variable values and the imports it already patches into the same file (`patchGlobals`). Tecton
needs more than `&:is(.dark *)`, which has no way of leaving a dark subtree again: an inverted
section (`<div class="light">` in a dark page, `<ThemeRoot theme="light">` in a dark shell) would
switch the tokens under it but not the variants. `DARK_VARIANT` in `tokens-build.mts` is the single
source of truth; it is written into `globals.css` and into the generated `scoped.css`, and
`tokens:check` fails if the two ever differ or if the CLI's stock line reappears.

## The light block

The same reasoning, one file further. `globals.css` gets its shadcn variables from the CLI in two
blocks, `:root` and `.dark`, and `.dark` repeats every `:root` declaration verbatim rather than
relying on inheritance — it has to, because an unregistered custom property's computed value is its
specified value **with `var()` already substituted**, resolved on the element that declares it. A
descendant inherits the substituted value, so `--primary: var(--tecton-color-action-primary-bg)`
only picks up the dark token because `.dark` declares it again on the dark element.

Nothing does that for light, and an inverted *light* section needs it: `<div class="light">` inside
a dark page (or `<ThemeRoot theme="light">` inside a dark shell) re-declares the raw `--tecton-*`
tokens — the export and the palette are keyed on `.light` / `[data-theme="light"]` as well as on
`:root` — but inherits `--background`, `--primary` and the rest already substituted from the dark
values above it, and renders half dark.

So `scripts/tokens-build.mts` rebuilds a `.light, [data-theme="light"]` block from the patched
`:root` body on every run and places it immediately after `.dark`. Both blocks are a single class or
attribute, (0,1,0) either way, so source order decides for an element that somehow carries both —
and light last is what `scoped-theme.css` already does for its own blocks. The same block is written
into `tecton-theme.css`, and `registry/theme.json` carries it under `css` (`cssVars` has no key that
reaches a light marker — the CLI maps `light` to `:root` and `dark` to `.dark`, and everything else
to `.<key>`; a plain selector under `css` is appended to the root of the consumer's stylesheet,
after the `:root`/`.dark` rules the same run writes). `registry/theme.json` also carries the Tecton
`dark` variant under `css`, appended after the CLI's own stock line, because Tailwind takes the last
definition of a variant name — without it a registry consumer would get the light block but keep
`dark:` utilities applying inside it.

`pnpm tokens:check` fails if the light block stops mirroring `:root` declaration for declaration, if
it moves before `.dark`, or if either copy of it drifts.

## Known CLI quirk: `"use client"` in `--diff`

With `rsc: false`, `shadcn add … --diff` and `shadcn add … --overwrite` disagree on whether the
`"use client"` directive is kept, so `--diff` reports a one-line difference for some files that
were written by the CLI itself. `scripts/generated-check.sh` runs `shadcn add <item> --diff <file>`
for every file under `src/components`, `src/hooks` and `src/lib` (the hooks and lib files are mapped
to the item that installs them in `item_for_support_file`; an unmapped file fails) and tolerates
exactly one thing: added or removed diff lines that are blank or consist only of the
`"use client"` directive. Every other diff line fails the check, and so does output it does not
recognise — no `├ src/<file> (…)` header for the file, a header other than `(skip)` or
`(overwrite)`, an `(overwrite)` with no diff lines under it, or a non-zero CLI exit. The CLI runs
with `NO_COLOR=1` and `FORCE_COLOR` unset, and escape sequences are stripped before parsing, so a
coloured CI log cannot hide drift. CI runs `pnpm --filter @tecton/react use-client:check` (below)
right after it, so the directive difference it tolerates cannot hide a directive that went missing.

## Restoring `"use client"`

The same quirk is a bug, and it drops the directive from files the CLI writes. With `rsc: false`
the CLI runs `transformRsc` over every written file
(`packages/shadcn/src/utils/transformers/transform-rsc.ts` at the pinned commit), and that
transform tests a **module-level `/g` regex**:

```ts
const directiveRegex = /^["']use client["']$/g
if (first && directiveRegex.test(first.getText())) first.remove()
```

A `/g` regex keeps `lastIndex` across calls and `test` only resets it on a miss, so within one
`shadcn add` run the directive is removed from the first file, kept in the second, removed from the
third… Which components keep it depends on how many files that invocation happened to touch and in
what order, so `shadcn add button` and `shadcn add sidebar` disagree about `button.tsx`.

`@tecton/react` is a client component library, so **every** file whose Base UI base source is marked
`"use client"` must keep the directive or an RSC consumer breaks at build time. After every
`shadcn add`, run:

```bash
pnpm --filter @tecton/react use-client:restore   # copies the directive back from the mirror clone
pnpm --filter @tecton/react use-client:check     # same counts, fails instead of writing
```

`scripts/restore-use-client.mts` reads each `src/components/<name>.tsx` alongside the `base` base
source in the mirror clone (`apps/v4/registry/bases/base/ui`), only ever **adds** the directive (a component upstream does not mark is
left alone) and preserves each file's line endings. It prints
`restored N / already present M / upstream has no directive K`; 37 of the 59 base UI items carry the
directive (the others render no hook of their own or only re-export Base UI parts, which carry
their own directive). Restoring it never breaks `pnpm generated:check`, which ignores directive-only
differences (above).

## Overlay hunks on this branch

The hunks in `tecton.patch`, all on `apps/v4/registry/bases/base/ui/*`:

- **Portal target** — every overlay honours Tecton's `PortalProvider` through
  `usePortalTarget()` (`@tecton/react/tecton/portal`, `HTMLElement | undefined`), passed to Base
  UI's `container` as `container ?? portalTarget`, so a container the caller passes wins. The
  `*Portal` wrappers take it (`DialogPortal`, `AlertDialogPortal`, `SheetPortal`, `DrawerPortal`,
  `DropdownMenuPortal`, `ContextMenuPortal`), and the content parts that render their own Portal gain
  an optional `container` prop (`PopoverContent`, `TooltipContent`, `HoverCardContent`,
  `SelectContent`, `ComboboxContent`, `DropdownMenuContent`, `ContextMenuContent`, and through them
  the `*SubContent` parts). `usePortalTarget()` is never `null`, which Base UI reads as "wait, render
  nothing". Submenus need no special case: a submenu with the target set portals into the target
  next to its parent, and Base UI's floating tree keeps the pair one menu.
- **Variant axes** — `alert`, `badge` (`appearance` and `size` go into `useRender`'s `state`, so they
  reach the DOM as `data-appearance` / `data-size`), `separator` (the colour moves from the base
  classes to the `emphasis` classes), `input`, `textarea`, `select` trigger; see the overlay table.
  `badge`'s focus ring becomes the Tecton `ring-2 ring-ring`.
- **`tabs.tsx`** — the default list sits on `bg-card`; the trigger loses its hard-coded
  `data-active` background / text colours, the `after:` indicator colour and the 3px translucent
  ring, which `style-tecton.css` sets instead. **`toggle.tsx`** loses `hover:bg-muted` the same way.
- **`button-group.tsx`** — logical corners (`rounded-e-none` / `rounded-s-none`), and members
  overlap by a pixel (`-ms-px` / `-mt-px`) instead of dropping a border, so every member draws a
  complete ring (the `cn-button-group` comment in `style-tecton.css`).
- **`sidebar.tsx`** — `SidebarProvider` gains `cookieName?: string | false` (default
  `"sidebar_state"`) and `keyboardShortcut?: string | false` (default `"b"`). Upstream hard-codes
  both, so several micro frontends rendering a sidebar on one page would share a cookie and one
  Ctrl/Cmd+B would toggle all of them; `false` opts out of the cookie write and of the `window`
  keydown listener entirely. Covered by
  `packages/tecton-react/src/tecton/__tests__/sidebar-provider.test.tsx`.
- **`slider.tsx`** — the thumb's `disabled:pointer-events-none disabled:opacity-50` becomes
  `data-disabled:pointer-events-none`: the thumb is a `div`, so `disabled:` never matched. Its own
  opacity is dropped because the control already fades (`data-disabled:opacity-50`).
- **`input-otp.tsx`**, **`calendar.tsx`** — classes that upstream passes outside a `className`
  (`containerClassName`; DayPicker's `classNames.dropdown_root` / `caption_label`) move into a `cva`
  (`inputOTPContainerVariants`, `calendarDropdownRootVariants`, `calendarCaptionLabelVariants`). The
  registry build inlines a style's classes only into a `className` or a `cva()`, so they stayed raw
  `cn-*` and the style's classes never arrived.
- **`sonner.tsx`** — upstream's `toastOptions={{ classNames: { toast: "cn-toast" } }}` is replaced
  by `richColors` and outlined status colours (`--success-*`, `--info-*`, `--warning-*`,
  `--error-*`: the popover surface with a status border and text, matching `alert` with
  `appearance="outline"`).

## Renaming the package

The literal `@tecton/react` appears in generated component self-imports, hand-written
`src/tecton` and block imports, apps/www examples and docs, config (tsconfig paths, the vitest
alias, the eslint config, the registry mirror overlay, the blocks registry builder) and prose —
about 800 tracked files. `scripts/rename-package.mts` rewrites all of it in one pass: run
`bun run scripts/rename-package.mts <new-name> --dry-run` first to preview the per-category file
and occurrence counts, then drop `--dry-run` against a clean working tree (it refuses a dirty one)
to write the changes. It skips generated output that must be rebuilt instead of edited
(`pnpm-lock.yaml`, `apps/www/public/r/**`, `packages/tecton-blocks/registry.json`,
`docs/TOKEN-MAPPING.md`, the agent index `packages/tecton-react/agent/**`) and prints the
follow-up checklist afterwards: `pnpm install`; rebuild and re-serve the registry mirror, then
re-add every item under `packages/tecton-react/src/components` with `--overwrite`, run
`use-client:restore` and `scripts/generated-check.sh`; `icons:build`, `tokens:build`, (if present)
`exports:build` and `agent:build` for the renamed package; `@tecton/blocks`'s `registry:build`; `pnpm docs:sync`; and
`pnpm typecheck && pnpm test && pnpm lint`.

Two things it does not handle: `scripts/registry-mirror/overlay/tecton.patch` only has its
added-line content rewritten, so re-verify with `scripts/registry-mirror.sh build`; and the shadcn
registry namespace `@tecton` (block item names, `registryDependencies`, consumers' `components.json`
registry key) is a distinct literal, left untouched on purpose.

## Build output

`pnpm --filter @tecton/react build` (`scripts/build.mts`, also run by `prepack` and by the root
`build:lib` / `typecheck`) writes `packages/tecton-react/dist/`, which is what the package
publishes — `src/` is not shipped. The output is **unbundled**: one `.js` + `.js.map` + `.d.ts` per
source module, mirroring `src/`. The `.js.map` embeds its sources; there is no `.d.ts.map`
(`declarationMap: false` in `tsconfig.build.json`), since it could only point into `src/`, which is
not published.

- **JS** — esbuild with every specifier marked external, so each file keeps its own
  `"use client"` directive and its imports: the `@tecton/react/...` self-imports of the generated
  components stay verbatim and the relative ones inside `src/icons` gain the `.js` extension ESM
  needs.
- **`.d.ts`** — `tsconfig.build.json` (`emitDeclarationOnly`) through the TypeScript API, with the
  `paths` mapping kept so the declarations also name `@tecton/react/...` verbatim; relative
  specifiers are rewritten to `.js` afterwards. `KNOWN_DTS_FAILURES` in `scripts/build.mts` lists
  the generated files whose declaration emit is known to fail; it is **empty**. Anything it does
  not list fails the build, so a new declaration error has to be fixed in the overlay rather than
  waived here.
- **CSS** — `src/styles/*.css` copied to `dist/styles/` with every `@source` directive collapsed
  into a single `@source "../**/*.js";`, so a consumer's Tailwind scans the built output.

The `exports` map in `packages/tecton-react/package.json` is **generated**, not hand-written:
`pnpm --filter @tecton/react exports:build` (`scripts/exports-build.mts`) enumerates one entry per
publishable module from the `src/` layout and points it at `dist/`; `exports:check` fails in CI when
the committed map is stale. There is no `"."` entry on purpose — the micro-frontend setup shares
the `@tecton/react/` prefix rather than a root module, so the bare import is intentionally
unsupported.

`pnpm generated:check` is unaffected by all of this: it diffs `src/components/*.tsx`, `src/hooks/*`
and `src/lib/*` against the registry, and `dist/` is build output that is gitignored and never diffed.
