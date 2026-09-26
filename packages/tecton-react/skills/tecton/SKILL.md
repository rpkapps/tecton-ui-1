---
name: tecton
description: >
  Write UI with @tecton/react (shadcn/ui themed for Tecton, one package). Look
  a component up with `tecton search "<what the UI must do>"`, read it with
  `tecton docs <id>`, and hold every file to the prop conventions and the
  finish checklist below. Load before writing or editing any JSX, import,
  className, prop or handler that uses @tecton/react.
metadata:
  type: core
  library: "@tecton/react"
  library_version: "0.1.0"
sources:
  - "guidelines/topics/rules.md"
  - "guidelines/topics/conventions.md"
  - "guidelines/families.json"
---

# @tecton/react

shadcn/ui themed for Tecton, shipped as one package. Every component the
application needs is already in it — look it up, don't guess it and don't
hand-build it.

## Look it up

The `tecton` command ships with the package (`npx tecton …` or
`pnpm exec tecton …`); it prints plain text sized for your context.

1. `tecton search "<what the UI must do>"` — up to five components, each with
   its import, a one-line "use it when" and the components it is **not** for.
   Search with the need, not the name you expect: "pick a date range",
   "keyboard shortcut hint", "section the user can expand".
2. `tecton docs <id>[,<id>]` — for **every** component you use: Use it when,
   Not for, Do, the Don't entries with Wrong/Correct code and the checks to
   run before you finish. Accepts an id (`alert-dialog`) or any export
   (`AlertDialogAction`).
3. Topics when the task needs them: `tecton docs conventions` (prop names,
   Root/Trigger/Content, `render`, state attributes), `tecton docs theming`
   (colours, tokens, modes, `ThemeRoot`, micro-frontends), `tecton rules`
   (setup, imports, palette, variants, icons in full).

`tecton list` prints every id with a one-line summary when a search misses.

## Imports

- `@tecton/react/components/<id>` — the shadcn components (`button`, `select`,
  `dialog`, `field`, `table`, …).
- `@tecton/react/tecton/<id>` — Tecton-only components (`chip`, `stat`,
  `panel`, `app-shell`, `provider`, …). `tecton search` prints the exact path.
- `@tecton/react/icons` — the oil & gas glyphs (`WellIcon`, `SeismicIcon`, …);
  every generic glyph comes from `lucide-react`.
- There is no root export, nothing is installed with `shadcn add`, and nothing
  is imported from `react-aria-components` or `@base-ui/react`.

## Prop conventions

| Not | But | On |
| --- | --- | --- |
| `onPress` | `onClick` | `Button`, `Toggle`, menu items |
| `isDisabled` | `disabled` (`focusableWhenDisabled` to keep focus) | every control |
| `isSelected` | `checked` / `onCheckedChange` | `Checkbox`, `Switch` |
| `selectedKey` / `onSelectionChange` | `value` / `defaultValue` / `onValueChange` (arrays for multi-value) | `Select`, `Combobox`, `RadioGroup`, `Tabs`, `ToggleGroup`, `Accordion` |
| `id` on an item | `value` | `SelectItem`, `TabsTrigger`, `ToggleGroupItem`, … |
| `isOpen` on a wrapping trigger | `open` / `onOpenChange` on the root | overlays and menus |
| `asChild` | `render={<Button variant="outline" />}` | triggers, `Badge`, `Item`, links |
| `placement` | `side` / `align` / `sideOffset` on the `*Content` part | popups |

An overlay or menu is a root (`Dialog`) holding a trigger
(`<DialogTrigger render={<Button />}>`) and a content part (`DialogContent`).
Style state with presence attributes: `data-open:`, `data-checked:`,
`data-active:`, `data-highlighted:`. One `TectonProvider` carries direction,
locale, router and portal container. Tecton binds no keyboard shortcuts.

## Before you finish

Every line has to hold in the file you wrote. Nothing at build time checks
them: a wrong one type-checks and renders wrong. (`tecton rules` has each one
in full; `agent:check` keeps this list in step with it.)

- **Imports** come from the three namespaces above — never the root, a
  `components/ui/` folder or the libraries underneath.
- **No stock Tailwind colour** (`bg-red-500`, `text-zinc-400`,
  `border-slate-300`) — the palette is reset, so they emit no CSS. Use a
  semantic token (`bg-primary`, `text-muted-foreground`, `text-destructive`,
  `bg-warning-surface`, `border-border`) or a Tecton step (`bg-blue-120
  text-blue-830`; steps `50 … 1570`, no `dark:` pair).
- **`className` carries layout only** (`w-full`, `mt-4`, `flex-1`, `gap-2`,
  `col-span-2`). Size, padding, radius, colour and type belong to the
  component's `variant` / `size` / `appearance` props.
- **Every control in a `Field` is labelled**: `FieldLabel htmlFor` → the
  control's `id` (on `SelectTrigger` for a `Select`); a group of controls is
  named by `FieldSet` + `FieldLegend`.
- **Tecton prop names**, per the table above — never `onPress`, `isDisabled`,
  `isSelected`, `selectedKey` or `isOpen`.
- **Overlays are Root + Trigger + Content**: the trigger takes
  `render={<Button />}`, the `*Content` part takes placement and width.
- **Empty results are `Empty`** (`EmptyTitle`, `EmptyDescription`); an empty
  `Table` shows it in place of the table or in one full-width cell.
- **Confirmations**: a transient one is `toast()` with one `<Toaster />` at the
  app root; one that stays until resolved is an `Alert` with a `variant`.
- **The component that already exists**: a KPI is `Stat`, a status label is a
  `Badge` with a `variant`, a removable or selectable tag is a `Chip` in a
  `ChipGroup` — never a coloured `div`.
- **Icons and spinners inside controls** (`Button`, `Badge`, `Chip`,
  `TabsTrigger`, `InputGroupAddon`) carry `data-icon="inline-start"` or
  `"inline-end"`.
- **Icon-only controls are named** with an `aria-label`; a `Tooltip` describes,
  it does not name.
- **Menu items act through `onClick`** (`CommandItem` through `onSelect`).
- **The `AlertDialog` confirm closes the prompt**: `AlertDialogAction` is a
  plain `Button`, so control the dialog and close it in the action's `onClick`.
- **Shortcuts are the application's**: a `Kbd` or `shortcut` only shows a key.
- **You ran `tecton docs`** for each component in the file and checked its
  Don't entries against your code.
