# Overflow and collapse rules

How a row of controls (`Overflow`, `Toolbar`, `ActionBar`, `PageHeaderActions`,
`PanelActions`, `AppShellActions`, canvas toolbars) gives up space when its
container gets narrower, and how it takes the space back. These rules are the
contract for `src/tecton/overflow.tsx` and for every host built on it.

## 1. Vocabulary

| Term | Meaning |
| --- | --- |
| Host | The component that owns the row and decides placement (`ActionBar`, `PageHeaderActions`, …). |
| Row | The single flex line the items are laid out on. Horizontal by default; vertical for side toolbars. |
| Item | One control in the row, wrapped in `OverflowItem`. Has an `id`, a `priority` and an overflow form. |
| Fixed item | A child that is not wrapped, or wrapped with `overflow="never"`. It never leaves the row. |
| Elastic item | An item that can shrink between a `min` and `max` inline size before anything else happens (search box, combobox). |
| Group | Items sharing an `OverflowGroup`. A group can collapse as one unit. |
| Divider | `OverflowDivider`, a `Separator` between groups or items. Never counted as an item. |
| Overflow menu | The trailing `OverflowMenu` trigger and its `DropdownMenu`. Present only while at least one item is hidden. |
| Reserve | Width the host keeps for content that is not part of the overflow computation (selection summary, primary action, dismiss). |
| Stage | One of the ordered steps below. A row is always in exactly one stage, and it moves one step at a time. |

Priority is an integer, default `0`. A higher priority stays in the row
longer. Priority never reorders anything; it only decides who leaves first.

## 2. Order of stages

The row moves down this list only when the previous stage cannot recover
enough space, and back up it in reverse order when space returns.

| Stage | What gives | Who decides |
| --- | --- | --- |
| 0 | Nothing. Every item at its natural size. | Layout |
| 1 | Elastic items shrink towards their `min`. | CSS (`flex-shrink`, `min-inline-size`) |
| 2 | Labels drop on items that allow it; those items become icon-only. | Measured, from the same observer as stage 3 |
| 3 | Items move to the overflow menu, lowest priority first. | Measured (`ResizeObserver`) |
| 4 | Host reserve compacts (selection summary shortens, dismiss becomes an icon). | CSS container query on the host |
| 5 | Last resort: the host wraps to a second line or clips with horizontal scroll. Never both. | Host prop `lastResort="wrap" \| "scroll"` |

Stages 2 and 3 share one measurement pass. Stages 1 and 4 are pure CSS and
never cause a render. Because 2 and 4 change item widths, the observer fires
and stage 3 recomputes with the new numbers; that is the only coupling
between the CSS stages and the measured ones.

Stage 4 sits after 3 on purpose: the reserve is what tells the user what the
actions apply to, and it is better to hide a third-tier action than to turn
"12 of 340 selected" into "12" while every action is still visible.

## 3. Stage 1: elastic items

1. An elastic item declares `min` and `max` inline sizes. Without a `max` it
   takes all free space; without a `min` it uses `12rem`.
2. Only elastic items shrink. Buttons, selects and dividers are `shrink-0`.
3. When several elastic items exist they shrink proportionally to their
   `flex-basis`, the browser default. No priority is applied at this stage.
4. An elastic item at its `min` is treated as a normal item from stage 3
   onwards: it can overflow, into a dialog (rule 6.6). Its cost in every
   width calculation is its `min`, never the width it happens to fill.

## 4. Stage 2: label collapse

1. Labels collapse for every item at once, as soon as the row with every
   item at full width no longer fits (`labels="auto"`, the default).
   `labels="always"` disables this stage; `labels="never"` renders icon-only
   from the start.
2. Labels come back only when every item, including the hidden ones, would
   fit again with its label. Each item caches two sizes, full and compact,
   so the decision needs no extra measurement and cannot oscillate.
3. An item can only go icon-only if it has an icon. A text-only item keeps
   its label and simply costs more width in stage 3.
4. An icon-only item must expose its label: `aria-label` equals the label
   text and a `Tooltip` shows the same text. This is done by `OverflowItem`,
   not by the consumer.
5. `labelBehavior="keep"` opts one item out of this stage. It stays labelled
   and leaves the row in stage 3 like any other item. Use it for destructive
   actions, where a lone icon invites mistakes, and for any action whose icon
   is not self-explanatory.
6. The primary action always keeps its label (it is fixed, see 7.1).
7. Dropdown triggers keep their chevron when they go icon-only. Toggle items
   keep their pressed styling.
8. Collapsing labels never changes an item's `id`, its element or its focus
   position. It is a class change only.

## 5. Stage 3: overflow

### Which item leaves

1. Candidates are all non-fixed items currently in the row, including
   elastic items at their `min` and items that are disabled.
2. The next item to leave is the candidate with the lowest priority. On a
   tie, the one nearest the logical end of the row leaves first (the
   rightmost in LTR, the leftmost in RTL). Items therefore disappear from
   the end inward, which is where the overflow menu sits.
3. A group with `collapse="together"` leaves as one unit when its lowest
   priority item would leave. A group with `collapse="individually"`, the
   default, is transparent to this rule.
4. The row keeps overflowing until the remaining items, the dividers still
   showing, the reserve and the overflow trigger all fit. If nothing else
   can leave and it still does not fit, the row enters stage 4, then 5.
5. `minimumVisible` (host default `0`) keeps at least that many candidates
   in the row regardless of width. Use it sparingly; it forces stage 5.

### Width accounting

6. Each item's inline size is measured once, when it is first laid out in
   the row, and cached. An item is measured again only when its own box
   resizes while visible (its label collapsed, its text changed).
7. Hidden items are `display: none`. They are not measured while hidden;
   their cached width is used to decide whether they can come back.
8. Gaps count. The row's `gap` is read once from computed style and added
   per visible item.
9. The overflow trigger's width is reserved as soon as one item is hidden
   and released only when the last hidden item returns.
10. Dividers are measured like items but never counted as candidates.

### Coming back (hysteresis)

11. Every pass recomputes the hidden set from scratch out of the cached
    widths, so an item returns exactly when its cached width plus its gap
    fits with the trigger still reserved, or when it is the last hidden item
    and the trigger's width counts as freed.
12. Items return in the reverse order they left: highest priority first, and
    on a tie the one nearest the logical start.
13. Returning is evaluated in the same pass as leaving, from the same
    measurement. There is never a frame where the row has both hidden an
    item and shown another for the same width.

### Groups and dividers

14. A divider is visible only while something visible remains on both
    sides of it (a spacer does not count; the overflow trigger counts for
    the trailing side). Once every item on one side has left, the divider
    leaves with them. The row sets `data-overflowing` on it exactly as on an
    item. A spacer follows the same rule; it costs no size, but it does
    occupy a gap slot like any other child.
15. Two dividers never render adjacent to each other.
16. A group keeps its `aria-label` when its members are visible and passes it
    to the menu section that holds them when they are hidden.

### Deferral

17. An item whose own popover, menu or select listbox is open is not hidden
    while it is open. The next lower-priority candidate leaves instead. The
    deferred item leaves at the next recomputation after it closes, if still
    needed.
18. An item that currently holds focus is hidden like any other, and focus
    moves to the overflow trigger. The trigger takes focus, not the menu:
    opening a menu on resize is disruptive.
19. An elastic item with a non-empty value is hidden like any other; its
    value carries into the popover form (rule 6.6).

## 6. Overflow forms

Every non-fixed item declares how it renders inside the overflow menu.
The default depends on the kind of control. Source order is preserved in
the menu; the menu never sorts by priority.

| Kind of control | Row form | Overflow form | Notes |
| --- | --- | --- | --- |
| Button | `Button` | `DropdownMenuItem` | Icon, label and shortcut carry over. |
| Destructive button | `Button variant="destructive"` | `DropdownMenuItem variant="destructive"` | Keeps source position; not moved to the end. |
| Toggle | `Toggle` | `DropdownMenuCheckboxItem` | Pressed state is the checked state. |
| Toggle group (single) | `ToggleGroup` | `DropdownMenuRadioGroup` | One radio item per option. |
| Toggle group (multiple) | `ToggleGroup` | One `DropdownMenuCheckboxItem` per option, in a section | |
| Dropdown trigger | `DropdownMenuTrigger` | `DropdownMenuSub` | Same items rendered in the submenu. |
| Select | `Select` | `DropdownMenuSub` with a `DropdownMenuRadioGroup` | Value maps to the checked radio item. |
| Text input, combobox, date picker | The control, elastic | `DropdownMenuItem` that opens a `Dialog` holding the same control | The control keeps its value and validation. React Aria 1.21 has no sub-dialog inside a menu, so the dialog is modal. |
| Link | `Link` | `DropdownMenuItem` rendering an anchor | |
| Divider | `Separator orientation="vertical"` | `DropdownMenuSeparator` | Only between two hidden neighbours. |
| Group | `OverflowGroup` | `DropdownMenuGroup` with a label | |
| Custom | Anything | Provided by `overflow={(item) => …}` | Required for a control not listed here. |

6.1. `overflow="never"` marks the item fixed; the item is then not a
candidate and must fit in the reserve (rule 7).

6.2. Disabled items appear disabled in the menu, with the same tooltip
reason if one was given.

6.3. A shortcut shown on the row button is shown as `DropdownMenuShortcut`
in the menu. The shortcut keeps working while the item is hidden, because
shortcuts are registered with the `Shortcuts` registry and not with the
button.

6.4. A hidden item's `onAction`, `onPress` and `onChange` handlers are the
same functions in both forms. The overflow form must never introduce a
second code path.

6.5. A submenu (rules for dropdown and select) is one level deep. If the
row control already has a submenu, that submenu is flattened into a
labelled section. There is never a third level.

6.6. The dialog form for inputs traps focus in the control. Closing it
returns focus to the overflow trigger. Submitting (Enter) closes it.

6.7. Nothing exists only in the menu. Every menu item corresponds to an item
that is in the row at some width. The menu is not a place to park
secondary actions; use a `DropdownMenu` in the row for that.

6.8. The overflow menu's trigger is an icon button with `aria-label="More
actions"`, the ellipsis icon, `aria-haspopup="menu"`, and a `CountBadge`
only if the host asks for it (`overflowBadge`). It is placed at the logical
end of the row, after any fixed trailing item.

## 7. Fixed items and the host reserve

7.1. The primary action of a host (`ActionBar`'s primary, `PageHeaderActions`'
main button) is fixed and keeps its label. There is at most one per row.

7.2. Dismiss, Clear selection and the overflow trigger are fixed.

7.3. The host reserve (selection summary, title, dismiss) is not part of the
row's measurement. The row receives the remaining space through normal
flex layout and measures only itself.

7.4. Fixed items plus reserve define the row's minimum inline size. A host
that can be narrower than that must set `lastResort`.

7.5. A host may promote one item to primary by prop, never by measurement.

## 8. Stage 4: reserve compaction

Host specific, always container-query driven, always three steps at most:

| Host | Full | Medium | Compact |
| --- | --- | --- | --- |
| `ActionBar` selection | "12 of 340 selected · Clear" | "12 selected · Clear" | `CountBadge` 12 + X icon |
| `ActionBar` message | "You have unsaved changes" | "Unsaved changes" | Dot indicator |
| `PageHeader` | Title, description, eyebrow | Title, eyebrow | Title only |
| `Panel` | Title, description | Title | Title, truncated |

The count is announced through an `aria-live="polite"` region that does
not compact, so the spoken text stays "12 of 340 selected" at every width.

## 9. Stage 5: last resort

9.1. `lastResort="wrap"` lets the row wrap. Wrapped rows keep every rule
above; the overflow menu still appears first, wrapping starts only when
fixed items alone do not fit. Default for `ActionBar` and `PageHeaderActions`.

9.2. `lastResort="scroll"` clips the row and scrolls it inline, with the
overflow trigger stuck to the end. Default for canvas toolbars and
`AppShellActions`, which sit on a single line by design.

9.3. Reaching stage 5 is logged once in development. It means a host was
given too many fixed items for its container.

## 10. Orientation

10.1. A vertical row (canvas side toolbar) applies every rule on block size
instead of inline size. Labels are already absent, so stage 2 is skipped.
A column never wraps, since wrapping would open a second column beside
it; its last resort is always to scroll.

10.2. The logical end of a vertical row is its bottom. Items leave from the
bottom and the overflow trigger sits at the bottom.

10.3. The overflow menu of a vertical row opens to the side, away from the
canvas edge the toolbar is docked to.

## 11. Direction

11.1. All positions are logical. "End" is right in LTR and left in RTL,
computed from the `dir` of the row.

11.2. The overflow trigger, dividers and menu placement follow the same
logical direction. Nothing uses `left` or `right`.

## 12. Focus and keyboard

12.1. A `Toolbar` row is one tab stop. Arrow keys move between visible
controls in visual order and skip hidden ones. The overflow trigger is the
last stop. Home and End go to the first and last visible control.

12.2. `Overflow` on its own (no `Toolbar`) leaves tabbing to the browser;
hidden items are `display: none` so they are already unreachable.

12.3. When a focused item is hidden, focus moves to the overflow trigger in
the same task, before paint. When a hidden item returns while the trigger is
focused, focus stays on the trigger.

12.4. The overflow menu closes when its last item returns to the row, and
focus returns to that item.

12.5. Menu items keep their row shortcuts, and pressing a shortcut acts
without opening the menu.

## 13. State preservation

13.1. Hidden items stay mounted. Their React state, refs, pending requests
and uncontrolled input values survive a resize.

13.2. The row form and the overflow form cannot share one element, because
the menu is a separate popover, so the overflow form is a second rendering
of the same props. Controlled state therefore lives in the
consumer, and every item that has state must be controlled or its state
lifted to the item declaration.

13.3. Toggling visibility uses `display: none` and the `data-overflowing`
attribute. Hosts may style `data-overflowing` for debugging but never rely
on it for behaviour.

## 14. Rendering cost

14.1. One `ResizeObserver` per row, observing the row's content box. Never
`window.resize`.

14.2. Item widths are cached (rule 5.6). A resize does one pass over the
cache in priority order; no DOM reads in that pass.

14.3. The visible set is held in a store outside React. Each `OverflowItem`
subscribes to its own id with `useSyncExternalStore` and rerenders only
when its own visibility flips. The overflow menu subscribes to the count.
The host and unaffected siblings do not rerender.

14.4. A pass that computes the same visible set as before writes nothing
and notifies nobody.

14.5. Registration is through context with stable callbacks; registering or
unregistering an item does not rerender other items.

14.6. Item reorders (a child added or removed) trigger one remeasure of the
new item only. Existing widths are kept.

14.7. First paint: every item renders visible with its label, one
measurement runs in a layout effect before paint and collapses what does
not fit. There is no flash of overflow.

14.8. No transition on hide or show. Items appear and disappear in one
frame. Only the host's own enter and exit (the `ActionBar` slide) animates.

## 15. One row per host

A host has one overflow row, never two side by side. Two rows in one flex
line cannot both measure a stable width: each would see a width that
depends on what it has already collapsed, and the collapse becomes sticky.
The page header therefore puts the section tabs and the actions in the
same row, with an `OverflowSpacer` between them, and lets priorities decide
the order: the view toggle first, the tabs second, the primary never.

15.1. Section tabs are one item and collapse all at once into a
single-selection section of the More menu, never one tab at a time: hiding
single tabs breaks arrow-key navigation and can hide the selected tab.

15.2. A row that contains a tab list is a plain `Overflow`, not a
`Toolbar`, so the two do not compete for the arrow keys.

15.3. A spacer has no size of its own. Like a divider, it leaves once
nothing visible remains on one side of it, so a collapsed row is never
pushed to the far end by an empty spacer.

## 16. What never happens

- Items are never reordered by collapsing.
- An item is never hidden without being reachable from the overflow menu.
- There is never more than one overflow menu per row, and never a nested
  one.
- Nothing collapses on hover, focus, or the open state of a menu. Only
  container size drives collapsing.
- Priority never affects visual order or menu order.
- A fixed item is never hidden, even in stage 5.
- The measured stage never changes the CSS stages. Only container width
  does.
- The overflow form never gains capabilities the row form lacks, and never
  loses an action the row form has.
