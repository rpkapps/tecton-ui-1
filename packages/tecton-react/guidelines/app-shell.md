---
component: AppShell
module: "@tecton/react/tecton/app-shell"
family: surfaces
exports: [AppShell, AppShellHeader, AppShellBrand, AppShellNav, AppShellHeaderActions, AppShellBody, AppShellSidebar, AppShellMain, AppShellAside, AppShellSplit, AppShellSplitPanel, AppShellSplitHandle, useMinWidth]
notFor:
  - need: a titled tool surface inside the work area
    use: Panel
  - need: the title block at the top of the page inside the main area
    use: PageHeader
  - need: a panel that floats over the page and is dismissed
    use: Sheet
related: [Panel, PageHeader, Sheet]
---

## Use it when

- The outermost frame of an application: a top bar, an optional left rail, a work area, an optional right aside.
- The frame fills the viewport (`h-svh`) and clips its own overflow, so each region scrolls on its own.
- A tool panel lives beside the content and the user may drag the divider between them.

## Do

- Compose it: `AppShellHeader` (with `AppShellBrand`, `AppShellNav`, `AppShellHeaderActions`), then `AppShellBody` holding `AppShellSidebar`, `AppShellMain` and `AppShellAside`.
- Put the page content in `AppShellMain`; it is the scrolling region of the work area.
- For a draggable divider, wrap the regions in `AppShellSplit` with an `AppShellSplitPanel` each and an `AppShellSplitHandle` between them.
- Gate a full-height aside on `useMinWidth(1280)` instead of squeezing it onto a narrow screen.
- Override only the height through `className` (`h-full` in an embedded context); the shell owns its surfaces and borders.

## Don't

### HIGH Page content placed straight into AppShellBody

Wrong:

```tsx
<AppShell>
  <AppShellHeader>
    <AppShellBrand>Tecton</AppShellBrand>
  </AppShellHeader>
  <AppShellBody className="overflow-y-auto p-6">{page}</AppShellBody>
</AppShell>
```

Correct:

```tsx
<AppShell>
  <AppShellHeader>
    <AppShellBrand>Tecton</AppShellBrand>
  </AppShellHeader>
  <AppShellBody>
    <AppShellMain className="p-6">{page}</AppShellMain>
  </AppShellBody>
</AppShell>
```

`AppShellBody` is the `flex min-h-0 overflow-hidden` row that holds the regions side by side, so content dropped into it is clipped at the fold and the sidebar and aside have nothing to sit beside.

### MEDIUM A split aside that keeps its own border

Wrong:

```tsx
<AppShellSplitPanel defaultSize="384px" minSize="280px">
  <AppShellAside>{inspector}</AppShellAside>
</AppShellSplitPanel>
```

Correct:

```tsx
<AppShellSplitPanel defaultSize="384px" minSize="280px">
  <AppShellAside className="h-full w-full border-l-0">{inspector}</AppShellAside>
</AppShellSplitPanel>
```

`AppShellAside` is a fixed 320 px column with its own left border, so inside a resizable panel it ignores the dragged width and draws a second divider next to the handle.
