# Adding a component

The steps to add a component to `@tecton/react`, in order. `AGENTS.md` has the rules they
follow; `NumberField` (`src/tecton/number-field.tsx`) is a complete recent example of every step.

## 1. Decide what it is

| The need                                                    | Do this                                                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| shadcn/ui has the component                                 | `shadcn add <item>` against the mirror (`docs/UPSTREAM.md`). No new code.                                 |
| A shadcn component in another look or size                  | A variant in the registry overlay (`scripts/registry-mirror/overlay/`), then re-add it. No new component. |
| A layout or screen made of existing components              | A block in `packages/tecton-blocks`, not a component.                                                     |
| Behaviour no shadcn component has (stepper, tree, meter, …) | A Tecton component: the rest of this page.                                                                |

Look for an existing component first: `pnpm --filter www exec tecton search "<what it must do>"`.

## 2. Write the component

One module per component: `packages/tecton-react/src/tecton/<name>.tsx` (kebab-case). The module
name is the public import path, `@tecton/react/<name>`.

- **Primitive.** Build on the Base UI primitive when one exists, and keep its prop names: `value` /
  `defaultValue` / `onValueChange`, `open` / `onOpenChange`, `disabled`, `render`. Behaviour Base UI
  has no component for (a tree, drag and drop) comes from the unstyled internal primitives in
  `src/tecton/internal/primitives/`, which follow the same shape: namespaced parts rendered through
  `useRender` / `mergeProps`, `value` / `onValueChange`, presence attributes (`data-selected`, not
  `data-selected="true"`). Reorder with `primitives/drag-and-drop/` (`useDragAndDrop` with a drop
  strategy, `useSortable` for one row or column), never with drag sessions of the component's own.
- **Strings.** Text the component draws itself (labels, announcements) comes from
  `const t = useTranslations("<namespace>")` (`src/tecton/internal/i18n/`). Add the namespace to
  `translations/en-US.ts`, the only locale bundled; other locales are `translations/<locale>.ts`
  files written with `defineTranslations` and loaded when a `TectonProvider` uses them.
- **shadcn conventions.** One function per part, named `<Component><Part>`, each rendering one element
  with `data-slot="<name>-<part>"`, a `className` merged with `cn` (from `"cn"`), and the rest of the
  props spread. Variants are a `cva` with `defaultVariants`, mirrored as `data-variant`. Parts take
  `ref` as a prop (React 19), no `forwardRef`.
- **Colours.** Semantic tokens only (`bg-primary`, `text-muted-foreground`), or a Tecton palette step
  (`bg-blue-120`). Never a stock Tailwind colour, a hex value or an arbitrary `[color:…]`. A surface
  no semantic token describes gets a new token (step 4), not a borrowed one from another component.
- **Direction and locale.** Read them from `TectonProvider` (`useDirection()` / `useLocale()` from
  `@tecton/react/provider`), never from the DOM. Use logical utilities (`ps-*`, `ms-*`,
  `start-*`, `text-start`, `rounded-s-*`) so the layout flips in RTL; mirror any horizontal pointer
  delta in RTL.
- **Portals.** Overlays render into `usePortalTarget()` from `@tecton/react/portal`.
- **Accessibility.** See step 3; it is part of writing the component, not a pass at the end.
- **Touch.** Hit areas of 44 px on coarse pointers (`pointer-coarse:`), `touch-action` set so a drag
  does not fight page scrolling, and pointer events (not mouse events) with pointer capture.
- **Rendering.** Keep state where it is used: a value that changes on every pointer move goes in a
  small subscriber part or a ref, not in the root, so the other parts do not re-render. Handlers
  passed to children are stable; no effect does what an event handler can.
- **`"use client"`** at the top when the module uses state, effects or event handlers.
- **No library names in the public surface.** Consumers type wrappers with the `<Part>Props`
  aliases the build appends to every module's `.d.ts`; do not export a Base UI or React Aria type
  under its own name.

## 3. Make it accessible

Start from the matching [WAI-ARIA APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) (spin
button, tree view, meter…); the Base UI primitive usually implements it, so keep its roles and
attributes instead of re-adding them. Target WCAG 2.2 AA.

- **Roles and names.** Every interactive part has its pattern's role and an accessible name. A part
  with only an icon gets a default `aria-label` the consumer can override ("Increase"). A unit,
  hint or error that belongs to the value is tied to the control with `aria-describedby`.
- **Labels.** Inside `Field`, the control takes the `id` that `FieldLabel htmlFor` points at;
  `FieldDescription` and `FieldError` describe it. Never put the only label in a `placeholder`.
- **Keyboard.** The pattern's full keyboard model (arrows, Home / End, Page Up / Down, Escape…), one
  tab stop per widget (roving `tabIndex` in a composite), nothing reachable only by mouse, drag
  or hover. A pointer gesture (drag, scrub, swipe) always has a keyboard or click equivalent
  (WCAG 2.5.7).
- **Focus.** A visible `focus-visible` ring in the `ring` token on every focusable part; focus moves
  into an overlay when it opens and back to the trigger when it closes; nothing steals focus.
- **States.** `disabled`, `aria-invalid`, `aria-expanded`, `aria-selected`, `aria-busy`… on the
  element assistive technology reads, mirrored as `data-*` for styling. Do not convey state by
  colour alone (WCAG 1.4.1): add an icon, text or shape.
- **Contrast.** Text 4.5:1, large text, icons and the boundary of a control 3:1, in both themes;
  `tokens:check` enforces it for every pair you add to `scripts/tokens-check.mts`.
- **Announcements.** A change the user does not cause by focusing (async result, copy confirmed,
  value clamped) goes through a polite live region or `aria-live`; avoid announcing on every
  keystroke or drag frame.
- **Target size.** At least 24 × 24 px on fine pointers (WCAG 2.5.8), 44 px on coarse pointers
  (`pointer-coarse:`).
- **Motion.** Animations stop or shorten under `motion-reduce:`; nothing flashes.
- **Zoom and text.** Works at 200 % zoom and 400 % reflow (320 px wide) without clipped text;
  sizes in `rem`, no fixed heights on text.
- **Direction.** Arrow keys and drags that mean "more" or "next" follow the reading direction.

Check it by hand before the PR: keyboard only, a screen reader (NVDA on Windows, VoiceOver on
macOS), 200 % zoom, `prefers-reduced-motion`, and Windows High Contrast (`forced-colors`) where the
component draws its own borders or fills. In tests, query by role and name (`getByRole("button",
{ name: "Increase" })`) so a missing name fails the test.

## 4. Add tokens (only if needed)

A new surface colour is a semantic token named after the component (`number-field-fill`), not
after the colour:

1. Add it to `packages/tecton-react/tokens/tecton.map.json`, with a `dark` (and `light` when they
   differ) Tecton variable, a `confidence` and a `note`. Both values are `--tecton-…` tokens, never a
   hex or other literal colour (the map's schema rejects one); when no token fits exactly, use the
   nearest Tecton token and explain the choice in the `note`.
2. Add its text pairs to the contrast checks in `scripts/tokens-check.mts` (4.5:1 for text).
3. `pnpm tokens:build && pnpm tokens:check`. Commit the generated CSS, `registry/theme.json` and
   `docs/TOKEN-MAPPING.md`.

## 5. Export it

`pnpm --filter @tecton/react exports:build` adds `./<name>` to the package `exports`
(derived from `src/`). There is no barrel file.

## 6. Test it

`src/tecton/__tests__/<name>.test.tsx` (Vitest + Testing Library). Cover: the rendered roles and
names, every prop that changes behaviour, controlled and uncontrolled use, keyboard, pointer and
touch input, `disabled`, RTL (inside `TectonProvider direction="rtl"`), and that parts re-render
only when they must.

## 7. Write the guideline

`packages/tecton-react/guidelines/<name>.md`. Its format is the contract in
`guidelines/README.md` (frontmatter, then "Use it when", "Do", "Don't" with Wrong / Correct
examples; 40 to 100 lines). Then:

- list the module in its family in `guidelines/families.json` (every public module is in exactly
  one), and add a checklist line to the family when it has a rule agents must not miss;
- point other guidelines' `notFor` and `related` at it where it is the better choice (e.g.
  `input.md` → `NumberField` for numbers), and add search words to `guidelines/synonyms.json`;
- `pnpm --filter @tecton/react guidelines:check`, then `agent:build` (never edit
  `agent/`), then `agent:check` and `pnpm --filter @tecton/react exec vitest run
  scripts/__tests__/agent-search.test.ts`.

## 8. Document it

- **Page:** `apps/www/content/docs/tecton/<name>.mdx` with `title` and `description` frontmatter, a
  demo `ComponentPreview`, `## Usage` (the import and the smallest composition), one section per
  feature, `## RTL`, then `## API Reference` (one table per part). Docs never name Base UI or React
  Aria.
- **Examples:** `apps/www/src/examples/<name>-<case>.tsx`, a default export, used as
  `<ComponentPreview name="<name>-<case>" />`. The RTL one uses `useTranslation` from
  `@/components/language-selector` and `direction="rtl"` on its preview. Examples import only from
  `@tecton/react/*`.
- **Navigation:** add the page to `apps/www/content/docs/tecton/meta.json` and a row to the table
  in `apps/www/content/docs/tecton/index.mdx`.
- **Guidelines section:** `pnpm --filter www docs:guidelines` writes the "Usage guidelines" section
  between the `guidelines:start` / `guidelines:end` markers; never edit it by hand.

## 9. Changelog

A line under `## [Unreleased]` → `### Added` in `CHANGELOG.md`. A new component is a minor
release (`RELEASE.md`).

## 10. Check

What CI runs, in order (from the repository root):

```sh
pnpm format:check
pnpm --filter @tecton/react build
pnpm --filter @tecton/react exports:check
pnpm --filter @tecton/react consumer:check
pnpm -r run typecheck
pnpm lint
pnpm test
pnpm tokens:check
pnpm --filter @tecton/react guidelines:check
pnpm --filter @tecton/react agent:check
pnpm --filter www docs:guidelines --check
pnpm --filter www build && pnpm --filter www links:check
```

Then look at the page in both themes and in RTL (`pnpm dev`), with a mouse and in touch emulation.
