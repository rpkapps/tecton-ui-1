---
component: Drawer
module: "@tecton/react/components/drawer"
family: overlays
exports: [Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, DrawerPortal, DrawerOverlay, DrawerSwipeHandle]
notFor:
  - need: a side panel on a pointer-driven screen
    use: Sheet
  - need: a modal decision or a short form on the desktop
    use: Dialog
  - need: a confirmation of a destructive action
    use: AlertDialog
related: [Sheet, Dialog]
---

## Use it when

- A touch screen: the panel is dragged in and flicked away with a thumb.
- The content should be able to rest at a partial height (`snapPoints`) before it is opened fully.
- A responsive pair, where the same content is a `Dialog` on the desktop and a drawer on a phone.

## Do

- Control it like every Tecton overlay, with `open`, `defaultOpen` and `onOpenChange` on `Drawer`; `disablePointerDismissal` keeps unsaved input from being flicked away by a backdrop press.
- Pass the trigger and close elements through `render`, not as children: `<DrawerTrigger render={<Button variant="outline" />}>Open</DrawerTrigger>`.
- Pick the edge with `swipeDirection="down" | "up" | "left" | "right"` and add the grab handle with `showSwipeHandle`, both on `Drawer`.
- Make the scrolling region a flex item — `<div className="flex-1 overflow-y-auto p-4">` — because `h-full` does not resolve inside a content-sized drawer.

## Don't

### HIGH React Aria state props on the drawer

Wrong:

```tsx
<Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
  <DrawerContent>
    <DrawerTitle>Filters</DrawerTitle>
  </DrawerContent>
</Drawer>
```

Correct:

```tsx
<Drawer open={isOpen} onOpenChange={setIsOpen}>
  <DrawerContent>
    <DrawerTitle>Filters</DrawerTitle>
  </DrawerContent>
</Drawer>
```

`Drawer` is the state root and renders no element of its own; `isOpen` is not among its props, so it reaches nothing and the drawer stays uncontrolled.

### HIGH Vaul's direction values on swipeDirection

Wrong:

```tsx
<Drawer swipeDirection="bottom">
  <DrawerTrigger render={<Button variant="outline" />}>Open</DrawerTrigger>
  <DrawerContent>
    <DrawerTitle>Layers</DrawerTitle>
  </DrawerContent>
</Drawer>
```

Correct:

```tsx
<Drawer swipeDirection="down">
  <DrawerTrigger render={<Button variant="outline" />}>Open</DrawerTrigger>
  <DrawerContent>
    <DrawerTitle>Layers</DrawerTitle>
  </DrawerContent>
</Drawer>
```

`swipeDirection` is typed `"up" | "down" | "left" | "right"`, so TypeScript rejects `"bottom"`; forced past that, the axis falls back to `x` and none of the `data-[swipe-direction=*]` rules match: the panel gets no edge, no radius and no closed transform.

### MEDIUM asChild on the trigger instead of render

Wrong:

```tsx
<DrawerTrigger asChild>
  <Button variant="outline">Open</Button>
</DrawerTrigger>
```

Correct:

```tsx
<DrawerTrigger render={<Button variant="outline" />}>Open</DrawerTrigger>
```

There is no `asChild`: the trigger renders its own `button` and nests the `Button` inside it, giving two stacked buttons and an invalid interactive element.
