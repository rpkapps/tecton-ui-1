# Overflow and collapse — the contract

Condensed from `docs/OVERFLOW-RULES.md`, the contract for
`@tecton/react/tecton/overflow` and every host built on it (`ActionBar`,
`PageHeaderActions`, `PanelActions`, `ShellActions`, canvas toolbars). Read
`../SKILL.md` first; this is the detail you need when the default behaviour is
not what you want.

## Vocabulary

| Term         | Meaning                                                                   |
| ------------ | ------------------------------------------------------------------------- |
| Host         | The component that owns the row (`ActionBar`, `PageHeaderActions`, …)      |
| Item         | One control wrapped in `OverflowItem`. Has `id`, `priority`, overflow form |
| Fixed item   | An unwrapped child, or `overflow="never"`. Never leaves the row            |
| Elastic item | Shrinks between `min` and `max` before anything else happens               |
| Group        | Items sharing an `OverflowGroup`; can collapse as one unit                 |
| Reserve      | Host space outside the computation (selection summary, primary, dismiss)   |

## Stage order

A row is always in exactly one stage and moves one step at a time, back up in
reverse when space returns.

| Stage | What gives                                      | Driven by                     |
| ----- | ----------------------------------------------- | ----------------------------- |
| 0     | Nothing — every item at natural size             | Layout                        |
| 1     | Elastic items shrink toward `min`                | CSS (`flex-shrink`)           |
| 2     | Labels drop; items become icon-only              | Measured                      |
| 3     | Items move to the overflow menu, lowest priority first | Measured (`ResizeObserver`) |
| 4     | Host reserve compacts                            | CSS container query           |
| 5     | Last resort: wrap **or** scroll, never both      | `lastResort` prop             |

Stages 2 and 3 share one measurement pass. Stage 4 sits after 3 deliberately:
better to hide a third-tier action than to turn "12 of 340 selected" into "12"
while every action is still visible.

## Stage 2 — label collapse

- Labels collapse for **every** item at once (`labels="auto"`, the default).
  `labels="always"` disables the stage; `labels="never"` starts icon-only.
- They come back only when every item, hidden ones included, would fit with
  its label — two cached sizes per item, so it cannot oscillate.
- An item can only go icon-only if it **has** an icon. Text-only items keep
  their label and cost more width in stage 3.
- An icon-only item must expose its label: `aria-label` plus a `Tooltip` with
  the same text. `OverflowItem` does this, not the consumer.
- `labelBehavior="keep"` opts one item out. Use it for destructive actions and
  any icon that is not self-explanatory.
- The primary action always keeps its label (it is fixed).

## Stage 3 — overflow

**Which item leaves.** The candidate with the lowest `priority`; on a tie, the
one nearest the logical end of the row. Items disappear from the end inward.
`priority` never reorders anything visually.

- A group with `collapse="together"` leaves as one unit.
- `minimumVisible` (default `0`) keeps N candidates in the row regardless of
  width. Use sparingly — it forces stage 5.
- Dividers are measured but are never candidates. A divider is visible only
  while something visible remains on both sides; two never render adjacent.

**Coming back.** Every pass recomputes the hidden set from cached widths, so
items return in the reverse order they left — highest priority first. Leaving
and returning are evaluated in the same pass, so there is never a frame that
hides one item and shows another for the same width.

**Deferral.** An item whose own popover or menu is open is not hidden while
open; the next candidate leaves instead. An item that holds focus *is* hidden,
and focus moves to the overflow trigger (not into the menu).

## Overflow forms

Every non-fixed item declares how it renders in the menu. Source order is
preserved; the menu never sorts by priority.

| Row form              | Overflow form                                           |
| --------------------- | ------------------------------------------------------- |
| `Button`              | `DropdownMenuItem`                                      |
| Destructive button    | `DropdownMenuItem variant="destructive"`, same position |
| `Toggle`              | `DropdownMenuCheckboxItem`                              |
| `ToggleGroup` single  | `DropdownMenuRadioGroup`                                |
| `ToggleGroup` multiple| One `DropdownMenuCheckboxItem` per option, in a section |
| Dropdown trigger      | `DropdownMenuSub`                                       |
| `Select`              | `DropdownMenuSub` with a `DropdownMenuRadioGroup`       |
| Input, combobox, date | `DropdownMenuItem` opening a `Dialog` with the control  |
| Divider               | `DropdownMenuSeparator`, only between two hidden neighbours |
| Custom                | `overflow={(item) => …}`                                |

- Handlers are the **same functions** in both forms — the overflow form never
  introduces a second code path.
- Submenus are one level deep; a row control's own submenu is flattened into a
  labelled section. Never three levels.
- Shortcuts keep working while an item is hidden (they register with
  `Shortcuts`, not with the button).
- **Nothing exists only in the menu.** Every menu entry corresponds to an item
  that is in the row at some width. The menu is not a place to park secondary
  actions — use a `DropdownMenu` in the row for that.
- The trigger is an icon button, `aria-label="More actions"`, at the logical
  end of the row after any fixed trailing item.

## Fixed items and the reserve

- The host's primary action is fixed and keeps its label. At most one per row.
- Dismiss, Clear selection and the overflow trigger are fixed.
- The reserve is not part of the row's measurement.
- Fixed items plus reserve define the row's minimum inline size. A host that
  can be narrower than that must set `lastResort`.

## Stage 4 — reserve compaction

| Host                   | Full                            | Medium                | Compact              |
| ---------------------- | ------------------------------- | --------------------- | -------------------- |
| `ActionBar` selection  | "12 of 340 selected · Clear"    | "12 selected · Clear" | `CountBadge` + X     |
| `ActionBar` message    | "You have unsaved changes"      | "Unsaved changes"     | Dot indicator        |
| `PageHeader`           | Title, description, eyebrow     | Title, eyebrow        | Title only           |
| `Panel`                | Title, description              | Title                 | Title, truncated     |

The count is announced through an `aria-live="polite"` region that does **not**
compact, so the spoken text stays "12 of 340 selected" at every width.

## Stage 5 — last resort

- `lastResort="wrap"` — default for `ActionBar` and `PageHeaderActions`.
- `lastResort="scroll"` — default for canvas toolbars and `ShellActions`.
- Reaching stage 5 is logged once in development. It means the host was given
  too many fixed items for its container.

## Orientation and direction

A vertical row applies every rule on block size; stage 2 is skipped (labels
are already absent), it never wraps, and its last resort is always scroll.
Items leave from the bottom. All positions are logical — "end" is right in
LTR, left in RTL. Nothing uses `left` or `right`.

## Focus and state

- A `Toolbar` row is one tab stop; arrow keys move between visible controls
  and skip hidden ones. The overflow trigger is the last stop.
- Hidden items stay **mounted** (`display: none`), so React state, refs and
  pending requests survive a resize.
- The row form and the overflow form are two renderings of the same props, so
  any item with state must be controlled — or its state lifted to the item
  declaration.

## One row per host

Never two overflow rows side by side in one flex line: each would measure a
width that depends on what the other already collapsed, and the collapse
becomes sticky. Use one row with an `OverflowSpacer`.

- Section tabs are **one** item and collapse all at once into a
  single-selection menu section — never one tab at a time.
- A row containing a tab list is a plain `Overflow`, not a `Toolbar`.
- A spacer has no size but occupies a gap slot, and leaves once nothing
  visible remains on one side, so a collapsed row is never pushed to the end.

## What never happens

- Items are never reordered by collapsing.
- An item is never hidden without being reachable from the overflow menu.
- Never more than one overflow menu per row, and never a nested one.
- Nothing collapses on hover, focus, or a menu's open state — only container
  size drives collapsing.
- A fixed item is never hidden, even in stage 5.
- The overflow form never gains a capability the row form lacks, and never
  loses an action the row form has.
