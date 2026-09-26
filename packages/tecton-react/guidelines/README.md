# Component usage guidelines

One file per exported module of `@tecton/react`, written once and rendered twice:

- the **docs site** shows it as the "Usage guidelines" section of the component page
  (`apps/www` inserts it between generated markers; never edit that section in the page);
- the **`tecton docs <id>`** command prints it to coding agents (with the family's `checklist`
  from `families.json`), and `tecton search` ranks the files by their "Use it when", "Do" and the
  `notFor` needs that point at them.

`adopted/` holds rules taken from another design system, one JSON file per source (today
`astryx.json`: usage rules adapted from Meta's Astryx and accepted by the Tecton design team). Each
rule names a guideline id and where it goes — `do` (a Do bullet), `checklist` (the component's
*Before you finish* list) or `rules` (every file) — and the build merges it into the agent page and
the docs site; the guideline files themselves are untouched. Deleting a source's file and running
`agent:build` and `docs:guidelines` removes all of its rules.

`topics/` holds the three hand-written pages that are not about one component — `rules.md`,
`react-aria.md`, `theming.md` — served as `tecton rules`, `tecton docs react-aria` and
`tecton docs theming`. The only Agent Skill the package ships is `skills/tecton/SKILL.md`, which
points agents at the command.

The generated component sources under `src/components/**` are never hand-edited, which is why
this guidance lives in a sidecar file instead of JSDoc. The folder ships in the package tarball.

## File name and frontmatter

The file is named after the module: `@tecton/react/components/badge` → `badge.md`,
`@tecton/react/tecton/count-badge` → `count-badge.md`. Families and membership are declared in
`families.json`; a module's family in the frontmatter must match it.

```md
---
component: Badge
module: "@tecton/react/components/badge"
family: labels
exports: [Badge]
notFor:
  - need: a tag the user can select or remove
    use: Chip
  - need: a count pinned to the corner of an icon or avatar
    use: CountBadge
  - need: a transient confirmation
    use: toast
related: [Chip, CountBadge]
---
```

| Field | Rule |
| --- | --- |
| `component` | The primary export. Must be exported by the module. |
| `module` | The import path. Must exist in the package `exports` map and match the file name. |
| `family` | A key of `families.json`; the module must be listed under it. |
| `exports` | Every export this file covers (compound parts included: `Chip`, `ChipGroup`, `ChipList`). Each must be a real export of the module. |
| `notFor` | The boundaries. `need` is the thing an agent wants, in plain words. `use` is the replacement: a `component` or `exports` name from any guideline file, or a key of `externals` in `families.json` (`toast`, `TanStack Table`). Every entry must name a replacement. |
| `related` | Components to read next. Same resolution rule as `use`. |

`notFor` is **only** in the frontmatter. The renderers emit it as the "Not for" list, so the body
must not repeat it.

## Body

Exactly these three headings, in this order, each non-empty:

```md
## Use it when

- A static label: a status, a category, the count of items in a list header.
- The label carries a meaning: `variant="success" | "warning" | "info" | "destructive"`.

## Do

- Pick the meaning with `variant` and the weight with `appearance="outline"`; never restyle with `className`.
- Put an icon first with `data-icon="inline-start"` so the padding adjusts.

## Don't

### HIGH Making a Badge clickable

Wrong:

```tsx
<Badge onPress={() => select("balder")}>Top Balder</Badge>
```

Correct:

```tsx
<ChipGroup aria-label="Horizons" selectionMode="single" onSelectionChange={setSelected}>
  <ChipList>
    <Chip id="balder">Top Balder</Chip>
  </ChipList>
</ChipGroup>
```

Badge renders a `span`, so the handler never fires and there is no focus or keyboard behaviour.
```

Rules for the sections:

- **Use it when** — two to four bullets naming the moments a developer reaches for this
  component. Written for someone choosing between components, not describing the API.
- **Do** — two to five bullets. Each names the prop, variant or composition that carries the
  design decision. This is where "use the variant, not `className`" lives, per component.
- **Don't** — one to six entries. Each entry is `### <SEVERITY> <five-to-eight-word title>`,
  a `Wrong:` code block, a `Correct:` code block, and one sentence naming the mechanism by which
  the wrong version fails. Severity is `CRITICAL` (broken in production, data or a11y loss),
  `HIGH` (wrong behaviour in common use) or `MEDIUM` (wrong in specific conditions).
  - A Don't must be **plausible** (an agent would write it), **shippable** (it renders without a
    runtime error, or it is a type error that a Vite dev server still runs because esbuild strips
    types; a loud runtime failure earns an entry only when the error does not name the fix),
    **specific** to this library (React Aria props, the Tecton palette, the variants), and
    **grounded** (traceable to the component source or its docs page).
  - Code blocks are `tsx`, complete enough to paste, with real export names and React Aria prop
    names (`onPress`, `isDisabled`, `isSelected`, `selectedKey`, `isOpen`). No `// ...`.
  - The wrong version must be something that looks right from a Radix or stock-Tailwind prior:
    `onClick`, `disabled`, `asChild`, `bg-green-600`, `<a>` inside a `Button`, hand-built
    status colours where a `variant` exists.

Keep a file between 40 and 100 lines. Prose is for the agent and the reviewer: no marketing, no
explanations of React or Tailwind, no repetition of the API reference.

## Tooling

- `pnpm --filter @tecton/react guidelines:check` validates every file against the rules above and
  reports the modules that have no file yet.
- `pnpm --filter @tecton/react agent:build` writes `agent/index.json` and `agent/docs/<id>.md`, the
  search index and pages behind the `tecton search` / `tecton docs` command, from these files,
  `topics/`, `adopted/`, `families.json` and `synonyms.json` (query words mapped to the words the
  guidelines use); `agent:check` fails on drift. The search, its ranking and the tokenizer the
  build shares live in `bin/tecton-lib.mjs`; `bin/tecton.mjs` is only the executable that runs its
  `main`.
- `pnpm --filter www docs:guidelines` renders the section into the component pages;
  `docs:sync` runs it too.
