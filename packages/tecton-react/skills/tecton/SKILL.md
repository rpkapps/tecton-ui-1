---
name: tecton
description: >
  Write UI with @tecton/react (shadcn/ui on React Aria, Tecton palette). Look a
  component up with `tecton search "<what the UI must do>"`, read it with
  `tecton docs <id>`, and hold every file to the React Aria prop map and the
  finish checklist below. Load before writing or editing any JSX, import,
  className, prop or handler that uses @tecton/react.
metadata:
  type: core
  library: "@tecton/react"
  library_version: "0.1.0"
sources:
  - "skills/core/SKILL.md"
  - "skills/react-aria/SKILL.md"
  - "guidelines/README.md"
---

# @tecton/react

shadcn/ui on **React Aria** (not Radix), themed for Tecton, shipped as one
package. Every component the application needs is already in it — look it up,
don't guess it and don't hand-build it.

## Look it up

The `tecton` command ships with the package (`npx tecton …` or
`pnpm exec tecton …`); it prints plain text sized for your context.

1. `tecton search "<what the UI must do>"` — up to five components, each with
   its import, a one-line "use it when" and the components it is **not** for.
   Search with the need, not the name you expect: "pick a date range",
   "keyboard shortcut hint", "section the user can expand".
2. `tecton docs <id>[,<id>]` — for **every** component you use: Use it when,
   Not for, Do, and the Don't entries with Wrong/Correct code (≈600–1,000
   tokens each). Accepts an id (`alert-dialog`) or any export
   (`AlertDialogAction`).
3. Topics when the task needs them: `tecton docs theming` (colours, tokens,
   modes, `ThemeRoot`, micro-frontends), `tecton docs react-aria` (every
   Radix→React Aria substitution with code), `tecton rules` (setup, imports,
   palette, variants, icons in full).

`tecton list` prints every id with a one-line summary when a search misses.

## Imports

- `@tecton/react/components/<id>` — the shadcn components (`button`, `select`,
  `dialog`, `field`, `table`, …).
- `@tecton/react/tecton/<id>` — Tecton-only components (`chip`, `stat`,
  `panel`, `page-header`, `app-shell`, `meter`, …). `tecton search` prints the
  exact path.
- `@tecton/react/icons` — the oil & gas glyphs (`WellIcon`, `SeismicIcon`, …);
  every generic glyph comes from `lucide-react`.
- There is no root export (`from "@tecton/react"` fails) and nothing is
  installed with `shadcn add`; never import from a `components/ui/` folder.

## React Aria props, not Radix props

| Radix habit | Here | On |
| --- | --- | --- |
| `onClick` | `onPress` | `Button`, `LinkButton`, `Link`, `Toggle`, `DialogClose` |
| `disabled` | `isDisabled` | every React Aria control (`Input`/`Textarea` keep `disabled`) |
| `checked` / `onCheckedChange` | `isSelected` / `onChange(isSelected)` | `Checkbox`, `Switch`, `Toggle` |
| `value` / `onValueChange` | `selectedKey` / `onSelectionChange(key)` | `Select`, `Tabs` |
| `value` on an item | `id` | `SelectItem`, `TabsTrigger`, `TabsContent` |
| `open` on the dialog | `isOpen` / `onOpenChange` on `DialogTrigger`, which wraps the trigger `Button` **and** the `Dialog` (no `DialogContent`) | `Dialog`, `AlertDialog`, `Sheet`, `Popover` |
| `asChild` | `LinkButton` for navigation, `render` where offered | `Button`, `Badge`, `DrawerTrigger` |
| `aria-invalid` | `isInvalid` (+ `data-invalid` on `Field`) | `Select`, `Checkbox`, `RadioGroup` |

`RadioGroup` keeps `value` / `onChange`; `Input` and `Textarea` are real DOM
elements with `value`, `onChange(event)`, `disabled`, `aria-invalid`. `Drawer`
is Base UI: `open` / `onOpenChange`. `onSelectionChange` hands you
`Key | null` — narrow it, don't cast it.

## Before you finish

Every line has to hold in the file you wrote. Nothing at build time checks
them: a wrong one type-checks and renders wrong.

- **Imports** come from the three namespaces above, never the root.
- **No stock Tailwind colour** (`bg-red-500`, `text-zinc-400`,
  `border-slate-300`) — the palette is reset, so they emit no CSS. Use a
  semantic token (`bg-primary`, `text-muted-foreground`, `text-destructive`,
  `bg-warning-surface`, `border-border`) or a Tecton step (`bg-blue-120
  text-blue-830`; steps `50 … 1570`, no `dark:` pair).
- **`className` carries layout only** (`w-full`, `mt-4`, `flex-1`, `gap-2`,
  `col-span-2`). Size, padding, radius, colour and type belong to the
  component's `variant` / `size` / `appearance` props.
- **Status has a variant**: `Badge variant="success"`, `Alert variant="warning"`
  — never a coloured `div`. A KPI is `Stat`, a removable or selectable tag is
  `Chip` in a `ChipGroup`, an empty list is `Empty`.
- **Every control in a `Field` is labelled**: `FieldLabel htmlFor` → the
  control's `id` (on `SelectTrigger` for a `Select`); a group of controls is
  named by `FieldSet` + `FieldLegend`.
- **Icons inside `Button`, `Badge`, `Chip`, `TabsTrigger`** carry
  `data-icon="inline-start"` or `"inline-end"`; an icon-only control has an
  `aria-label`.
- **Menus act through `onAction`**; the `AlertDialog` confirm is
  `AlertDialogAction`; a `toast()` needs one `<Toaster />` at the app root.
- **You ran `tecton docs`** for each component in the file and checked its
  Don't entries against your code.
