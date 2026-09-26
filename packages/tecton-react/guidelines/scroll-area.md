---
component: ScrollArea
module: "@tecton/react/components/scroll-area"
family: layout
exports: [ScrollArea, ScrollBar]
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

- Give it a size: `h-*` or `max-h-*`, or `min-h-0 flex-1` when it is the growing child of a flex column; the viewport inside is `size-full` of it.
- Scroll sideways by making the content wider than the box (`whitespace-nowrap`, or an inner `flex w-max` row) and adding `<ScrollBar orientation="horizontal" />` as a child.
- Put the padding on a wrapper inside the area, so the border and the scrollbar stay outside it.
- Leave focus to the component: the viewport becomes a tab stop by itself whenever it overflows.

## Don't

### HIGH A hand-styled scrollbar on a plain overflow-auto box

Wrong:

```tsx
<div className="h-72 w-48 overflow-auto rounded-md border [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300">
  <div className="p-4">{versions}</div>
</div>
```

Correct:

```tsx
<ScrollArea className="h-72 w-48 rounded-md border">
  <div className="p-4">{versions}</div>
</ScrollArea>
```

`ScrollArea` hides the native bar and draws its own themed thumb (`bg-border`) in every engine; the `::-webkit-scrollbar` pseudo-elements do nothing in Firefox, and `bg-gray-300` is stock Tailwind, which the reset palette turns into no CSS at all.

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

The viewport is `size-full` of the root, so with no height the root grows to its content, never overflows, and the whole page scrolls instead of the region.

### MEDIUM Horizontal overflow with no horizontal ScrollBar

Wrong:

```tsx
<ScrollArea className="w-96 rounded-md border whitespace-nowrap">
  <div className="flex w-max gap-4 p-4">{thumbnails}</div>
</ScrollArea>
```

Correct:

```tsx
<ScrollArea className="w-96 rounded-md border whitespace-nowrap">
  <div className="flex w-max gap-4 p-4">{thumbnails}</div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

`ScrollArea` renders only the vertical `ScrollBar` and hides the native ones, so the row still scrolls with a trackpad but shows no bar: a mouse user never learns there is more.
