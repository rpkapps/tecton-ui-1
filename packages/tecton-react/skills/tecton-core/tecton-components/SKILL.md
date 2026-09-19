---
name: tecton-components
description: >
  The Tecton-only components under @tecton/react/tecton/* — Chip, CountBadge,
  CircularProgress, Meter, ColorSwatch, TreeView, Stat, Panel, PageHeader,
  AppShell, CopyButton, Link, ActionBar, Canvas, Overflow, Shortcuts,
  AppFinder, Background, Portal, ShellActions. Load when a component seems
  missing from @tecton/react/components, when building a tag list, a KPI
  readout, a progress ring, a hierarchical tree, a card-with-header, or a
  page/app frame, and before writing any new component for a Tecton
  application. Covers the decision rule for when something is a Tecton
  component versus a variant of a shadcn component versus application code —
  the judgement agents get wrong most often by rebuilding what already exists
  or by inventing a component where a variant was intended.
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
sources:
  - 'rpkapps/tecton-ui-1:README.md'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/tecton'
  - 'rpkapps/tecton-ui-1:packages/tecton-react/src/tecton'
---

# Tecton UI — Tecton-only components

A Tecton component exists **only when shadcn has no counterpart**. Everything
under `@tecton/react/tecton/` composes the generated shadcn components; it does
not replace them.

```tsx
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"
import { Stat, StatLabel, StatValue } from "@tecton/react/tecton/stat"
```

They follow the same conventions as the generated components — `data-slot`,
`cva` variants, `cn`, React Aria primitives, `onPress` not `onClick`.

## Before you build one

Work down this list. Stop at the first match.

1. **Is it a shadcn component?** Check `tecton-core/components` and the
   [component index](../components/references/component-index.md). 59 modules
   cover most of the surface.
2. **Is it a *variant* of one?** Tecton deliberately ships these as variants,
   not components: an alert with a severity (`variant="warning"`), a divider
   with an emphasis (`emphasis="strong"`), a filled input (`variant="filled"`),
   a status badge (`variant="success"`), a floating action button
   (`size="icon"`). Do not build `<StatusBadge>`; use `<Badge variant>`.
3. **Is it a Tecton component?** The table below.
4. **Is it a data table?** `Table` + TanStack Table — `tecton-core/data-tables`.
5. **Only then**, write it in the application — composed from Tecton
   components, using semantic tokens, no new colours.

If you conclude the design system is missing something, say so rather than
inventing a parallel component: a second `Chip` in application code is how a
design system stops being one.

## The components

| Component          | Use for                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `Chip`             | Selectable / removable tags (React Aria `TagGroup`)                |
| `CountBadge`       | A numeric count on an icon, tab or overflow trigger                |
| `CircularProgress` | Progress or busy state as a ring                                   |
| `Meter`            | A bounded measurement against a range (`primary` `success` `warning` `error` `info` `custom`) |
| `ColorSwatch`      | A colour value, optionally editable with presets                   |
| `TreeView`         | Hierarchical data with folders, visibility toggles and row actions |
| `Stat`             | A KPI readout: label, value, delta, help text                      |
| `Panel`            | A titled region with header, actions, content and footer           |
| `PageHeader`       | Page title, eyebrow, description, nav and actions                  |
| `AppShell`         | The application frame: header, sidebar, main, aside, split panes   |
| `ActionBar`        | A contextual bar for a selection, with a count and actions         |
| `Overflow`         | A row of controls that collapses into a menu as space runs out     |
| `Canvas`           | The map / 3D viewport frame with docked toolbars                    |
| `Shortcuts`        | The keyboard-shortcut registry                                      |
| `AppFinder`        | The cross-application launcher                                      |
| `Background`       | The Tecton page background treatment                                |
| `CopyButton`       | Copy a value to the clipboard with feedback                         |
| `Link`             | A text link with the Tecton link tokens                             |
| `Portal`           | The portal target the overlay components render into                |
| `ShellActions`     | The header action row of the app shell                              |

## Core patterns

### Chip — a tag list, not a badge

`Badge` is a static status marker. `Chip` is interactive: selectable,
removable, keyboard-navigable.

```tsx
import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

;<ChipGroup
  aria-label="Active filters"
  selectionMode="multiple"
  onRemove={(keys) => removeFilters([...keys])}
>
  <ChipList>
    {filters.map((f) => (
      <Chip key={f.id} id={f.id} variant="info">
        {f.label}
      </Chip>
    ))}
  </ChipList>
</ChipGroup>
```

Giving the group an `onRemove` handler is what makes every chip removable —
each one renders its own remove button and answers Backspace and Delete. Chips
are styled with `badgeVariants`, so a chip and a badge with the same
`variant`/`appearance`/`size` look identical.

### Stat — a KPI readout

```tsx
import { Stat, StatDelta, StatGroup, StatLabel, StatValue } from "@tecton/react/tecton/stat"

;<StatGroup>
  <Stat>
    <StatLabel>Producing wells</StatLabel>
    <StatValue>1,284</StatValue>
    <StatDelta>+4.2%</StatDelta>
  </Stat>
</StatGroup>
```

### Panel — a titled region

`Card` is a generic surface. `Panel` is the Tecton region with a header slot
for actions and a content area that scrolls.

```tsx
import {
  Panel, PanelActions, PanelContent, PanelHeader, PanelTitle,
} from "@tecton/react/tecton/panel"

;<Panel>
  <PanelHeader>
    <PanelTitle>Horizons</PanelTitle>
    <PanelActions>
      <Button variant="ghost" size="icon-sm" aria-label="Add horizon">
        <AddIcon />
      </Button>
    </PanelActions>
  </PanelHeader>
  <PanelContent>…</PanelContent>
</Panel>
```

For `AppShell`, `PageHeader`, `ActionBar` and `Overflow`, see
`tecton-core/layout`.

## Common Mistakes

### HIGH Rebuilding a Tecton component in application code

Wrong:

```tsx
function StatusBadge({ status }: { status: Status }) {
  return <span className="rounded-full bg-green-100 px-2 text-green-800">{status}</span>
}
```

Correct:

```tsx
<Badge variant="success">{status}</Badge>
```

Tecton ships status as a **variant axis** on `Badge` and `Alert` precisely so
every screen renders it identically. A hand-rolled version loses the dark-mode
pair and the contrast check, and here it also renders unstyled because
`bg-green-100` is not a Tecton class. See `tecton-core/styling`.

Source: `README.md § Design rules`

### HIGH Using `Badge` where the tag is interactive

Wrong:

```tsx
<Badge onPress={() => removeFilter(f.id)}>
  {f.label} <CloseIcon />
</Badge>
```

Correct:

```tsx
<ChipGroup aria-label="Filters" onRemove={(keys) => removeFilters([...keys])}>
  <ChipList>
    <Chip id={f.id}>{f.label}</Chip>
  </ChipList>
</ChipGroup>
```

`Badge` renders a `<span>`. It has no press handling, no focus management and
no keyboard removal, so the close affordance is unreachable without a mouse.
`Chip` is a React Aria `TagGroup` item and handles all three.

Source: `packages/tecton-react/src/tecton/chip.tsx`

### MEDIUM Reaching for `Card` when the region has a header with actions

Wrong:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Horizons</CardTitle>
    <div className="absolute top-3 right-3">
      <Button size="icon-sm" aria-label="Add"><AddIcon /></Button>
    </div>
  </CardHeader>
</Card>
```

Correct:

```tsx
<Panel>
  <PanelHeader>
    <PanelTitle>Horizons</PanelTitle>
    <PanelActions>
      <Button variant="ghost" size="icon-sm" aria-label="Add"><AddIcon /></Button>
    </PanelActions>
  </PanelHeader>
</Panel>
```

`PanelActions` is an overflow row: it collapses into a menu as the panel gets
narrower, and it compacts the title before the actions disappear. An absolutely
positioned button does neither, and overlaps the title at narrow widths.

Source: `docs/OVERFLOW-RULES.md § 8`

### MEDIUM Adding `onClick` to a Tecton component

Wrong:

```tsx
<CopyButton value={wellId} onClick={track} />
```

Correct:

```tsx
<CopyButton value={wellId} onCopied={track} />
```

Tecton components are built on React Aria primitives and follow the same
convention as the generated components: `onPress`, never `onClick`. Several
also expose a more specific callback — `CopyButton` has `onCopied`,
`ActionBarSelection` has `onClear`, `TreeViewVisibilityToggle` has `onChange`.

Source: `packages/tecton-react/src/tecton/copy-button.tsx`

See also: `tecton-core/layout/SKILL.md` — `AppShell`, `PageHeader`, `ActionBar`
and the overflow rules that govern every Tecton action row.
