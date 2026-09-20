---
component: Marker
module: "@tecton/react/components/marker"
family: conversation
exports: [Marker, MarkerIcon, MarkerContent, markerVariants]
notFor:
  - need: a status or category label that sits inside a line of text
    use: Badge
  - need: a keyboard key or a shortcut hint
    use: Kbd
  - need: a link inside a sentence
    use: Link
  - need: a divider with no label on it
    use: Separator
related: [Message, Badge, Separator]
---

## Use it when

- A full-width row between turns: "Thinking...", "Explored 4 files", "Marcus joined the chat".
- A labelled divider inside a transcript: a date, a section break, an unread line.
- The row leads back to what the agent touched: a file, a diff, a pull request.

## Do

- Compose it: `MarkerIcon` for the glyph, `MarkerContent` for the text, which carries the meaning on its own.
- Pick the layout with `variant="default" | "border" | "separator"`; `separator` draws its own rules to each side.
- Announce work in progress with `role="status"` and a `Spinner` inside `MarkerIcon`.
- Shimmer streaming text with `className="shimmer"` on `MarkerContent`.
- Make it interactive with `render={(props) => <a {...props} href={url} />}`, and wrap it in a `MessageScrollerItem` to anchor it.

## Don't

### HIGH A status line faked with a coloured span

Wrong:

```tsx
<span className="flex items-center gap-2 text-xs text-gray-500">
  <CheckIcon className="h-4 w-4" />
  Explored 4 files
</span>
```

Correct:

```tsx
<Marker>
  <MarkerIcon>
    <CheckIcon />
  </MarkerIcon>
  <MarkerContent>Explored 4 files</MarkerContent>
</Marker>
```

`text-gray-500` emits no CSS once the stock palette is reset, so the row renders at the inherited colour and size, and it loses `MarkerIcon`'s `aria-hidden` and the `size-4` rule that keeps every glyph in the transcript the same.

### HIGH role="separator" on a labelled divider

Wrong:

```tsx
<Marker variant="separator" role="separator">
  <MarkerContent>Today</MarkerContent>
</Marker>
```

Correct:

```tsx
<Marker variant="separator">
  <MarkerContent>Today</MarkerContent>
</Marker>
```

A `separator` takes its accessible name from `aria-label` and its contents are treated as presentational, so the visible "Today" is never announced; the rules on each side are decorative `before:` / `after:` pseudo-elements and need no role at all.

### MEDIUM An anchor wrapped around the marker

Wrong:

```tsx
<a href="/pull/482">
  <Marker>
    <MarkerContent>View the pull request</MarkerContent>
  </Marker>
</a>
```

Correct:

```tsx
<Marker render={(props) => <a {...props} href="/pull/482" />}>
  <MarkerContent>View the pull request</MarkerContent>
</Marker>
```

The underline and `hover:text-foreground` treatments are `[a]:` descendant rules inside `markerVariants`, so an outer anchor matches none of them and nests a `w-full` flex row inside an inline element.
