---
component: ResizablePanelGroup
module: "@tecton/react/components/resizable"
family: layout
exports: [ResizablePanelGroup, ResizablePanel, ResizableHandle]
notFor:
  - need: a draggable divider between the regions of the application frame
    use: AppShellSplit
  - need: a navigation rail the user collapses and expands
    use: Sidebar
  - need: a titled tool surface whose body scrolls
    use: Panel
related: [AppShellSplit, Panel, ScrollArea]
---

## Use it when

- Two or three regions share one axis and the user decides how the space is split: a tree beside an editor, a list above a detail.
- The split is a working preference worth remembering (`defaultLayout` in, `onLayoutChanged` out), not a fixed design.
- The regions are peers; neither is chrome wrapped around the other.

## Do

- Size panels with unit strings on `defaultSize`, `minSize` and `maxSize` — `"25%"`, `"320px"`, `"20rem"` — and show a grip with `withHandle` when the divider should be obvious.
- Give the group a height from outside (`className="h-96"`, or a flex parent): it is `flex h-full w-full` and brings none of its own.
- This module wraps react-resizable-panels: the props are that library's own (`disabled`, `collapsible`, `onLayoutChanged`, `panelRef`), and a `ResizableHandle` must be a direct child of its group.

## Don't

### HIGH The v3 direction prop instead of orientation

Wrong:

```tsx
<ResizablePanelGroup direction="vertical" className="h-96 rounded-lg border">
  <ResizablePanel defaultSize="30%">{results}</ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize="70%">{detail}</ResizablePanel>
</ResizablePanelGroup>
```

Correct:

```tsx
<ResizablePanelGroup orientation="vertical" className="h-96 rounded-lg border">
  <ResizablePanel defaultSize="30%">{results}</ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize="70%">{detail}</ResizablePanel>
</ResizablePanelGroup>
```

react-resizable-panels v4 renamed the axis prop to `orientation`, so `direction` is spread onto the group `div` as a stray attribute: the group keeps the default horizontal axis, and the `aria-[orientation=vertical]:flex-col` rule that stacks the panels never matches.

### HIGH A bare number for defaultSize

Wrong:

```tsx
<ResizablePanelGroup orientation="horizontal" className="h-96">
  <ResizablePanel defaultSize={25} minSize={20}>{tree}</ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={75}>{editor}</ResizablePanel>
</ResizablePanelGroup>
```

Correct:

```tsx
<ResizablePanelGroup orientation="horizontal" className="h-96">
  <ResizablePanel defaultSize="25%" minSize="20%">{tree}</ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize="75%">{editor}</ResizablePanel>
</ResizablePanelGroup>
```

In v4 a number means **pixels** and only a string is read as a percentage, so this type-checks and renders a 25 px tree with a 20 px minimum next to a 75 px editor — the split looks collapsed on first paint.

### MEDIUM isDisabled instead of disabled on a handle

Wrong:

```tsx
<ResizablePanelGroup orientation="horizontal" className="h-96">
  <ResizablePanel defaultSize="50%">{left}</ResizablePanel>
  <ResizableHandle withHandle isDisabled={isLocked} />
  <ResizablePanel defaultSize="50%">{right}</ResizablePanel>
</ResizablePanelGroup>
```

Correct:

```tsx
<ResizablePanelGroup orientation="horizontal" className="h-96">
  <ResizablePanel defaultSize="50%">{left}</ResizablePanel>
  <ResizableHandle withHandle disabled={isLocked} />
  <ResizablePanel defaultSize="50%">{right}</ResizablePanel>
</ResizablePanelGroup>
```

`ResizableHandle` reads `disabled` and spreads everything else onto the `div`, so `isDisabled` becomes a stray attribute and the divider stays draggable while the interface says it is locked.
