---
component: AppFinder
module: "@tecton/react/tecton/app-finder"
family: navigation
exports: [AppFinder, AppFinderTrigger, AppFinderMenu, AppFinderInput, AppFinderList, AppFinderGroup, AppFinderItem, AppFinderIcon, appFinderIconVariants]
notFor:
  - need: a short list of actions opened from a header button
    use: DropdownMenu
  - need: a palette of commands and records inside one application
    use: Command
  - need: the global action cluster at the end of the shell header
    use: AppShellActions
related: [Command, AppShellActions, AppShell]
---

## Use it when

- The shell header switches between independently deployed applications.
- The catalogue is large enough that a flat menu stops working: categories, search, short codes.
- The current application has to stay visible in the header as a tinted code tile.

## Do

- Compose `AppFinder` > (`AppFinderTrigger`, `AppFinderMenu` > `AppFinderInput` + `AppFinderList` > `AppFinderGroup` > `AppFinderItem`).
- Describe the current app on the trigger: the short code as children, `name` for the label beside the tile, the category's `tone`.
- Navigate from `onSelect` on `AppFinderList`; it receives the item's `value` and closes the popover afterwards. Control the popover with `open` / `onOpenChange` on `AppFinder` when you need to.
- Give every item a unique `value` across groups, `keywords` for its short code and category, and `current` on the mounted one; the filter matches `name` and `keywords`, never `value`.
- Reuse `AppFinderIcon` wherever else the tile is needed — a launcher grid, a command palette row.

## Don't

### CRITICAL Hand-tinting the app tile with className

Wrong:

```tsx
<AppFinderItem value="dwp" icon="DWP" name="Well Planning" className="bg-emerald-100 text-emerald-800" />
```

Correct:

```tsx
<AppFinderItem value="dwp" icon="DWP" tone="green" name="Well Planning" />
```

`className` lands on the row and never on the tile, and `emerald` is not a Tecton palette family, so both classes emit no CSS under the reset palette — `tone` is the `cva` axis that paints the tile `bg-green-120 text-green-830`.

### HIGH A search field of your own above the list

Wrong:

```tsx
<AppFinderMenu>
  <Input value={query} onChange={(event) => setQuery(event.target.value)} />
  <AppFinderList onSelect={switchTo}>{appsMatching(query)}</AppFinderList>
</AppFinderMenu>
```

Correct:

```tsx
<AppFinderMenu>
  <AppFinderInput />
  <AppFinderList onSelect={switchTo}>{everyApp}</AppFinderList>
</AppFinderMenu>
```

`AppFinderMenu` mounts a `Command` that owns the query, and `AppFinderInput` is the `CommandInput` bound to it: a separate `Input` leaves that value empty, so the filter over each item's `name` and `keywords` never runs, the match is never highlighted, and the arrow keys no longer move from the field into the list.

### MEDIUM A Recent group left visible while searching

Wrong:

```tsx
<AppFinderGroup heading="Recent">
  <AppFinderItem value="recent-dwp" icon="DWP" tone="green" name="Well Planning" />
</AppFinderGroup>
```

Correct:

```tsx
<AppFinderGroup heading="Recent" hideWhileSearching>
  <AppFinderItem value="recent-dwp" icon="DWP" tone="green" name="Well Planning" />
</AppFinderGroup>
```

The filter runs across every group at once, so without `hideWhileSearching` a query lists the same application twice — once from "Recent", once from its category — under two different values, and `onSelect` reports whichever row the user happened to press.
