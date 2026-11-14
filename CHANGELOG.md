# Changelog

All notable changes to `@tecton/react`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). [RELEASE.md](RELEASE.md) explains how to
write entries and cut a release.

## [Unreleased]

### Added

- `DataTable` (`@tecton/react/data-table`): the data table for records in an application, built
  on `Table`. Columns are typed with `createColumns` (text, number, date, yes / no and options,
  formatted with `Intl` in the provider locale, empty values drawn as a muted dash). The parts add
  sorting by one or several columns, search, a filter per column with "No value" and the active
  filters as chips (`DataTableToolbar`, `DataTableSearch`, `DataTableFilter`,
  `DataTableActiveFilters`), column resizing, reordering, hiding and pinning
  (`DataTableColumnsMenu`), row selection with `DataTableActionBar` and `itemToDisabledReason`,
  row actions (`DataTableRowActions`), row reordering, grouping with subtotals
  (`DataTableGroupBy`), totals, trees and detail rows, virtualized rows, load more on scroll or
  from a "Show more" row after the last row (as tall as a row, with the rows shown of the
  total), pages in a spreadsheet-style footer strip (`DataTableFooter`,
  `DataTablePagination`, with a page field), `size="sm"` and `striped`, loading, error, empty and
  no-results states, server mode (`dataMode="server"`), CSV export, keyboard navigation as a grid
  and the whole view (sort, filters, columns, page) as one controlled or uncontrolled value.
  Every filter value in the view is a list a row matches any item of, with `empty: true` for "No
  value": `values` for text (several texts in its popover, as removable chips; a quoted text keeps
  its comma, `"Smith, John"`), options and yes / no (checkboxes, which keep chosen values the
  options do not list), and `ranges` for numbers (`{ min?, max?, minExclusive?, maxExclusive? }`)
  and dates (`{ from?, to? }`), whose popover edits the first range and says how many more there
  are.
  A date-only string in a saved view's date filter (`"2024-03-01"`) is the start of that day in the
  column's `format.timeZone` (else the local zone), so the view keeps the same days in every zone.
  `useDataTable()` reads the table from custom parts. Its text is translated into the 34 locales.
- `DataTableSearch syntax="query"`: a power search. Typed terms (`status:drilling td:>3000
spud:2015`) set the same column filters as the filter buttons and free words the search: a comma
  means "any of" for every column type (`well:a-12,b-3`, `td:<1000,>3000`, `spud:2015,last30d`;
  a number or date keeps its own comma, `1,234.5`, `jun 30, 2015`; a range's `..` may follow a
  space, `spud:2015 ..2016`), a typed term replaces its column's filter (also one the query cannot
  write), and a filter button, chip or controlled view writes the query again. The field draws the query in
  colours, suggests columns, values with their row counts, comparisons with the data's range and a
  date's presets, years, months and calendar in a list that stays open while the field has focus
  (with nothing to suggest, a line says what the term at the caret does, or its problem, read
  out politely), explains a term it cannot apply (`OR`, `NOT`, a leading `-`, an unknown column
  or value; a `-` alone is text) instead of applying it otherwise (in a list, only the item with
  the problem is left out: `status:legacy,producing` applies `producing`, `legacy` underlined),
  with what to type instead in the table's own terms (`status:drilling,producing` for one of
  several values), lists the table's columns with examples in its "?" help, and works in server
  mode, RTL and the 34 locales. Its code loads on demand: a table with the plain search
  (`syntax="text"`, the default) never loads it. What was typed, the focus and the caret carry
  over when it arrives, after the view's filters, also for a field focused before a
  server-rendered page hydrated.
- `DataTable`'s number filter ranges take `minExclusive?: true` and `maxExclusive?: true`: the
  bound's own number does not match (more than `min`, less than `max`). Its filter button and chip
  read "> 3,000" or "> 1,000 and ≤ 3,000", and editing that bound in the filter includes it again.
  Server-mode applications that read the filter value should apply both flags.
- `DataTable` takes `highlightChanges` for live data (`true`, or `{ duration }` in ms): a row added
  to `items` after the first render goes straight to its sorted place with a neutral tint across
  the whole row (pinned columns too, over its stripe, hover or selection), which stays until the
  row is seen (half of it in view, on the page shown) and then fades over 1.5 s. Rows not seen yet
  are counted in one button per edge of the table, shaped and animated as the message scroller's:
  "↑ 3 new rows" above the view, "↓ 2 new rows" below it, else "3 new rows on other pages"; it
  goes to the topmost row above, the nearest below, or the first one's page. The row the user is
  on never moves: the one with an open menu, else focus, else the pointer, else the first in view
  once scrolled stays at its place on screen as rows land or go above it. With `pagination`, rows
  that would land on an earlier page while the user works in the rows come once they are done.
  Rows of the first render, of a load (`loading`, `onLoadMore`) or of a new server view are not
  additions, nor rows a search shows again. Screen readers hear "3 rows added", at most once a
  second; with reduced motion the button jumps instead of scrolling. `onPageChange` has the
  reason `"new-rows"` for the page that button turns to. Its strings are in the 34 locales.
- `DatePicker` and `DateRangePicker` (`@tecton/react/date-picker`): a date or a range picked on a
  `Calendar` in a popover, from a button or a typed date (`variant="input"`), with `minDate` /
  `maxDate`, range presets (bounded by `minDate` / `maxDate`), a Clear button, `name` for forms,
  and dates written in the provider locale.
- `Table` takes `size` (`"default"` or `"sm"`, compact) and `striped` (every even body row on an
  alternate surface; hovered and selected rows keep their own fill, a virtualized table keeps each
  row on its stripe as it scrolls, and a row that sorting moves takes its new stripe at once).
  `TableBody` takes `empty`, shown in one row across every column when there are no rows.
- `TableColumnResizer` takes `edge="start"`, for a column that grows toward its start (one pinned
  to the table's end).
- `Progress` with `value={null}` is indeterminate: a segment sweeps across the track (right to left
  in RTL), and the bar pulses slowly instead with reduced motion.
- Opaque surfaces (`Card`, `Sheet`, `Drawer`, `Dialog`, `Popover`, the menus, `Select`, `Sidebar`,
  `Panel`, the `AppShell` parts, `ActionBar` and others) set the `--surface` CSS variable to their
  fill; `DataTable`'s pinned columns are filled with it. A custom surface sets it too.

### Changed

- `Table`: the body has Tecton's table cell surface as its fill (white in light mode) whatever the
  table sits on, so the stripes show in light mode too, and a row hovers with Tecton's table hover
  surface. Two theme tokens come with them: `table-cell` (`bg-table-cell`) and `table-hover`.
- **BREAKING:** `DropdownMenu` is no longer modal by default: the page keeps scrolling while it is
  open, and a press outside closes the menu and still reaches what it pressed. Pass `modal` to get
  the previous behaviour.
- **BREAKING:** `Select` is no longer modal by default, and `SelectContent` opens its list below
  the trigger, aligned to its start (`alignItemWithTrigger` now defaults to `false` and `align` to
  `"start"`), instead of over it with the selected item on the value. Pass `modal` on `Select` and
  `alignItemWithTrigger` on `SelectContent` to get the previous behaviour; either one locks the
  page's scroll while the list is open.
- `ActionBar`: its text ("2 of 9 wells selected", Clear, the clear button's and the toolbar's names)
  is translated and its numbers are formatted in the provider locale; an inline bar takes its place
  at once, and only the floating bar fades in.
- `Field`: a field's label, control and description sit `gap-2` apart instead of `gap-3`, so a
  form is a little tighter.
- `NumberField`: the minus and plus buttons are named in the provider locale ("Increase" and
  "Decrease" in English). `Overflow`'s default "More actions" is translated too.
- `TableColumnResizer`: the line is in the drop line's colour with no tint behind it on hover, the
  width shows on the tooltip's surface, and the drag guide stops above the table's horizontal
  scrollbar.
- `Reorderable`: a keyboard drag starts at the item's own place, announced between its
  neighbours (a drop there moves nothing), and each arrow key moves it one place.

### Fixed

- `Checkbox`: a disabled checkbox looks disabled outside a `Field` too.
- `Overflow`: a hidden item whose content changed (a renamed label, a summary cleared from
  outside) is measured again, so the same width always gives the same layout.
- `Overflow` and `Toolbar` (and so `DataTableToolbar`) rendered on the server no longer show every
  item, without the More button, until the page hydrates. Until the row has measured itself in the
  browser (`data-measured`), it keeps to one line and what may still move keeps its place unseen:
  the items that can go into the menu, the dividers and whatever follows them. The fixed and
  elastic items before them (a table's search) show. Once measured, the items that fit and the
  More button appear in the same frame, and a row that fits never shows a More button. A row
  mounted in the browser measures before its first paint, as before.
- `Chip`: after its remove button is pressed, focus goes to the chip now in its place, as after
  Delete, instead of to the page.
- `DataTableContent`: a `ref` given to it no longer takes the place of the table's own, which the
  table sizes, focuses and measures itself through.

## [0.3.0] - 2026-11-02

### Added

- `NumberField` (`@tecton/react/number-field`): a numeric input with minus and plus buttons, `min` /
  `max` / `step`, arrow-key and mouse-wheel stepping, a nullable value, `Intl` formatting in the
  provider locale, a unit suffix, a
  scrubbable label, and `NumberFieldSlider`, which fills to the value and changes it on a sideways
  drag (#14).
- `Dropzone` (`@tecton/react/dropzone`): a drag-and-drop file picker built on `Empty` and
  `Attachment`. It checks files against `accept`, `maxSize`, `minSize`, `maxFiles` and `multiple`,
  reports refused files to `onFileReject` with a reason and a ready message, submits the files with
  a form through `name`, moves focus sensibly after a removal, and announces added, refused and
  removed files. `useDropzone()` and `formatFileSize()` are exported too.
- `DocumentTabs` (`@tecton/react/document-tabs`): workspace tabs the user opens, closes,
  renames and reorders, like browser tabs. The parts mirror `Tabs`; `onClose`, `onRename` and
  `onReorder` turn each action on. Tabs that do not fit move into a More menu, a context menu offers
  Rename, Close and Close other tabs (`DocumentTabsMenu` to choose the items), `size="sm"` gives a
  nested strip, and `messages` translates the strip's text.
- `TreeView`: `contextMenu` gives every row a context menu (right-click, long press, Shift+F10 or
  the Menu key) from a single mounted menu; `onMove` makes rows draggable by pointer, touch and
  keyboard, between rows at any level or into folders, with `canDrop` for your own rules and
  `moveTreeItems()` to apply a move to your data; `virtualized` renders only the rows in view, for
  trees of thousands of rows. Rows also carry `data-context-menu-open` and `data-drop-target`, and
  a drop animates (`dropAnimation={false}` turns it off; never with reduced motion).
- `Reorderable` (`@tecton/react/reorderable`): rows, columns or items the user drags into
  their own order with a pointer, a finger, the keyboard or a screen reader. `ReorderableItem`
  renders through `render` (a `TableRow`, a `TableHead`, any element), `ReorderableHandle` is the
  grip, and `orientation` is `"vertical"`, `"horizontal"` (a row of items such as table columns) or
  `"grid"` (cards in rows that wrap). `mode="swap"` keeps a fixed layout of `ReorderableSlot`s whose
  items, of any size, swap places like dashboard tiles. A drop animates (`dropAnimation={false}`
  turns it off; never with reduced motion).
- `TableColumnResizer` (`@tecton/react/table-column-resizer`): the grip on a column header's
  edge that sets the column's width by dragging or with the arrow keys, documented in Data Table's
  Column resizing section.
- `Table` takes `virtualized`: it scrolls in a parent of bounded height, the header sticks, and
  `TableBody` with `items` and a render function mounts only the rows in view, with
  `aria-rowcount` / `aria-rowindex` and the focused row kept. Without `virtualized` the markup is
  unchanged. The Table and Data Table docs gain virtualized, tree, row-reorder, column-reorder and
  column-resize examples.

### Changed

- `Input`, `Textarea`, `SelectTrigger` and `NumberField` now look like Tecton's text field. `variant="filled"`
  is rounded on every side with no underline, keeps its background on hover, and uses the new
  `input-filled` and `input-filled-focus` tokens for its surface. `variant="text"` shows its
  underline only on focus. Error and disabled states are unchanged.
- `TreeView`: rows rendered from `items` are kept while `items` and the render function stay the
  same, so selecting, focusing or expanding a row re-renders only what changed.
- `@tecton/react` no longer depends on `react-aria-components`. `TreeView`, `Chip` and the
  drag-and-drop reordering of `TreeView` and `DocumentTabs` run on Tecton's own primitives, with the
  same props and keyboard behaviour, so applications install and bundle less.
- The text Tecton components draw themselves (labels and screen-reader announcements) is
  translated into 34 locales. Only English is bundled; the `TectonProvider` locale's strings load on
  demand, so the first render is in English until they arrive.
- `TreeView` drag and drop: on touch screens a row also drags from its grip without a long press;
  a collapsed folder held under the dragged rows opens; from the keyboard, Tab also steps through
  the drop positions and Right / Left open and close the folder aimed at; with a screen reader on a
  touch screen, activating the grip turns every drop position into a button. A drag near an edge
  also scrolls the container or page the tree sits in.

### Fixed

- `ColorSwatch`: dragging in the custom colour picker no longer lags. The picker's colour now
  reaches `onColorChange` at most once per frame (the final colour lands on release), the picker's
  own value is no longer written back mid-drag, and the presets are resolved only when they change
  instead of on every pointer move (#26).
- Field: `FieldError` now has the same line height as `FieldDescription`, so a field that swaps
  its description for an error keeps its height and its input no longer moves.
- Typography: `globals.css` now loads Figtree 600 and 700, so `font-semibold` and `font-bold` (and
  the `largeStrong` style) use real font faces instead of a blurry synthesized bold. The browser no
  longer fakes missing weights (`font-synthesis-weight: none`) (#23).
- Command guideline: a new CRITICAL rule says `CommandDialog` needs a `Command` root around
  `CommandInput` and `CommandList`; without it the palette throws when it opens (#21).
- Fonts 404 in Vite production builds when `globals.css` goes through `@tailwindcss/postcss`: the
  installation guide now says to use `@tailwindcss/vite` with Vite, or to run `postcss-import` and
  `postcss-url` (`{ url: "rebase" }`) before `@tailwindcss/postcss`. Rsbuild, Rspack and webpack are
  not affected (#20).

## [0.2.1] - 2026-10-15

### Changed

- `toast` (`@tecton/react/toast`): micro-frontend remotes now share the shell's toast stack.

### Fixed

- `CodeBlock`: added and removed lines use a light status tint, so the code on them stays readable.

## [0.2.0] - 2026-10-15

### Added

- `Toaster` and `toast` (`@tecton/react/toast`): temporary messages with `toast.add`,
  `toast.update`, `toast.close`, `toast.promise` and the Tecton outlined status colours. Mount
  `<Toaster />` once; it takes `container` (portal target) and `toastManager` (from
  `createToastManager`, for a queue of your own).
- `Trace` (`@tecton/react/trace`): one-line rows for an assistant's reasoning, tool calls,
  sources and plan steps, with `running`, `error` and `pending` states and rows that expand.
- `CodeBlock` (`@tecton/react/code-block`): code, terminal output and diffs with an
  optional header, line numbers and a copy button; `useHighlightedCode`
  (`@tecton/react/use-highlighted-code`) adds syntax colours, and `highlightCode`
  (`@tecton/react/highlighter`) highlights on the server.

### Changed

- `@tecton/react/federation/shared` no longer shares `@tecton/react/` or the
  libraries underneath it: each application keeps its own copy. It now lists `react`,
  `react-dom`, `recharts` and `shiki/`. Removed entries: `@tecton/react/`,
  `@base-ui/react`, `@base-ui/react/` and `react-aria-components`. Hosts that copied the list
  by hand should drop them.
- The package no longer installs `next-themes`. Applications that set the `dark` class with it
  add it to their own dependencies (`pnpm add next-themes`).

## [0.1.3] - 2026-10-14

### Added

- Every component module exports a `<Part>Props` type for each exported part
  (`import type { DialogContentProps } from "@tecton/react/dialog"`).

## [0.1.2] - 2026-10-14

### Changed

- README: rewritten install steps.

## [0.1.1] - 2026-10-13

### Added

- A package README covering install, setup and usage.

### Security

- Tag stripping in the icon build, the docs sync and the docs-site page tree now repeats until no
  tag is left (code scanning `js/incomplete-multi-character-sanitization`).

## [0.1.0] - 2026-10-12

First release.

### Added

- The shadcn/ui components in the Tecton theme, with right-to-left support.
- Tecton components such as App shell, Panel, Page header, Chip, Stat and Tree view.
- `TectonProvider`, which sets direction, locale, routing and theme in one place.
- Oil and gas icons.
- Stylesheets for standalone apps and for micro-frontends.
- Usage guidelines for every component, and the `tecton` CLI for coding agents.

Everything is imported one module at a time from the package root, for example
`@tecton/react/button` or `@tecton/react/icons`.

[Unreleased]: https://github.com/rpkapps/tecton-ui-1/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/rpkapps/tecton-ui-1/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/rpkapps/tecton-ui-1/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rpkapps/tecton-ui-1/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/rpkapps/tecton-ui-1/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/rpkapps/tecton-ui-1/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/rpkapps/tecton-ui-1/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/rpkapps/tecton-ui-1/releases/tag/v0.1.0
