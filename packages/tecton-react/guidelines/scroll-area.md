---
component: ScrollArea
module: "@tecton/react/components/scroll-area"
family: layout
exports: [ScrollArea]
notFor:
  - need: a chat transcript that follows new messages
    use: MessageScroller
  - need: the scrolling body of a titled tool surface
    use: PanelContent
  - need: the scrolling work area of the application frame
    use: AppShellMain
related: [Panel, MessageScroller, ResizablePanelGroup]
---

## Use it when

- A bounded region has more content than height: a tag list, a log, a long option list inside a card.
- The scrollbar is going to be seen often enough that the browser default looks out of place.
- The region scrolls on its own while the page around it stays still.

## Do

- Give it a size: `h-*` or `max-h-*`, or `min-h-0 flex-1` when it is the growing child of a flex column. It only sets `overflow-auto`.
- Scroll sideways by making the content wider than the box (`whitespace-nowrap`, or an inner `flex w-max` row); there is no `orientation` prop and no separate scrollbar part.
- Put the padding on a wrapper inside the area, so the border and the scrollbar stay outside it.
- Add `tabIndex={0}` with `role="region"` and an `aria-label` when the content holds nothing focusable.

## Don't

### HIGH A hand-styled scrollbar on a plain overflow-auto box

Wrong:

```tsx
<div className="h-72 w-48 overflow-auto rounded-md border [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
  <div className="p-4">{versions}</div>
</div>
```

Correct:

```tsx
<ScrollArea className="h-72 w-48 rounded-md border">
  <div className="p-4">{versions}</div>
</ScrollArea>
```

`ScrollArea` styles the real scrollbar with the standard `scrollbar-width: thin` and `scrollbar-color: var(--color-border) transparent`, so it follows the theme in every engine; the `::-webkit-scrollbar` pseudo-elements do nothing in Firefox, and `bg-gray-300` is stock Tailwind, which the reset palette turns into no CSS at all.

### HIGH A scroll area with no height

Wrong:

```tsx
<ScrollArea className="w-full rounded-md border">
  <Table>{rows}</Table>
</ScrollArea>
```

Correct:

```tsx
<ScrollArea className="h-96 w-full rounded-md border">
  <Table>{rows}</Table>
</ScrollArea>
```

The component is one `div` carrying `overflow-auto` and nothing else, so with no height it grows to its content, never overflows, and the whole page scrolls instead of the region.

### MEDIUM A scroll region the keyboard cannot reach

Wrong:

```tsx
<ScrollArea className="h-72 w-full rounded-md border">
  <pre className="p-4 text-xs">{jobLog}</pre>
</ScrollArea>
```

Correct:

```tsx
<ScrollArea tabIndex={0} role="region" aria-label="Job log" className="h-72 w-full rounded-md border">
  <pre className="p-4 text-xs">{jobLog}</pre>
</ScrollArea>
```

`ScrollArea` ships `outline-none focus-visible:ring-[3px]` but sets no `tabIndex`, so a region whose content has no focusable children can never take focus: the ring is unreachable and the text can only be read with a pointer.
