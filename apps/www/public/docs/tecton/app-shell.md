# App Shell

The application frame: top bar, optional sidebar, main work area and optional right aside.

Source: /docs/tecton/app-shell.md

**Example — `app-shell-demo`**

```tsx
import { HexagonIcon } from "lucide-react"

import {
  AppShell,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellMain,
} from "@tecton/react/tecton/app-shell"

export default function AppShellDemo() {
  return (
    <AppShell className="h-64 w-full max-w-2xl overflow-hidden rounded-lg border">
      <AppShellHeader>
        <AppShellBrand>
          <HexagonIcon />
          Tecton
        </AppShellBrand>
      </AppShellHeader>
      <AppShellBody>
        <AppShellMain className="p-4 text-sm text-muted-foreground">Work area</AppShellMain>
      </AppShellBody>
    </AppShell>
  )
}
```

## Usage

```tsx
import {
  AppShell,
  AppShellHeader,
  AppShellBrand,
  AppShellNav,
  AppShellHeaderActions,
  AppShellBody,
  AppShellSidebar,
  AppShellMain,
  AppShellAside,
  AppShellSplit,
  AppShellSplitPanel,
  AppShellSplitHandle,
  useMinWidth,
} from "@tecton/react/tecton/app-shell"
```

```tsx
<AppShell>
  <AppShellHeader>
    <AppShellBrand>Tecton</AppShellBrand>
    <AppShellNav>…</AppShellNav>
    <AppShellHeaderActions>…</AppShellHeaderActions>
  </AppShellHeader>
  <AppShellBody>
    <AppShellSidebar>…</AppShellSidebar>
    <AppShellMain>…</AppShellMain>
    <AppShellAside>…</AppShellAside>
  </AppShellBody>
</AppShell>
```

> The shell fills the viewport by default. The previews on this page pass a fixed height through `className`.

## Composition

Use the following composition:

```text
AppShell
├── AppShellHeader
│   ├── AppShellBrand
│   ├── AppShellNav
│   └── AppShellHeaderActions
└── AppShellBody
    ├── AppShellSidebar
    ├── AppShellMain
    └── AppShellAside
```

## Sidebar

`AppShellSidebar` is a 256 px left column on the sidebar surface; put a [Tree View](/docs/tecton/tree-view.md) or the shadcn [Sidebar](/docs/components/sidebar.md) inside.

**Example — `app-shell-sidebar`**

```tsx
import { HexagonIcon, SettingsIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  AppShell,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellHeaderActions,
  AppShellMain,
  AppShellNav,
  AppShellSidebar,
} from "@tecton/react/tecton/app-shell"
import { TreeView, TreeViewItem, TreeViewItemContent } from "@tecton/react/tecton/tree-view"

export default function AppShellSidebarExample() {
  return (
    <AppShell className="h-72 w-full max-w-3xl overflow-hidden rounded-lg border">
      <AppShellHeader>
        <AppShellBrand>
          <HexagonIcon />
          Tecton
        </AppShellBrand>
        <AppShellNav>
          <Button variant="ghost" size="sm">
            Wells
          </Button>
          <Button variant="ghost" size="sm">
            FDA
          </Button>
        </AppShellNav>
        <AppShellHeaderActions>
          <Button variant="ghost" size="icon-sm" aria-label="Settings">
            <SettingsIcon />
          </Button>
        </AppShellHeaderActions>
      </AppShellHeader>
      <AppShellBody>
        <AppShellSidebar className="w-48 p-2">
          <TreeView aria-label="Project" defaultExpandedKeys={["wells"]}>
            <TreeViewItem id="wells" textValue="Wells">
              <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
              <TreeViewItem id="a12" textValue="34/10-A-12">
                <TreeViewItemContent>34/10-A-12</TreeViewItemContent>
              </TreeViewItem>
            </TreeViewItem>
            <TreeViewItem id="horizons" textValue="Horizons">
              <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
            </TreeViewItem>
          </TreeView>
        </AppShellSidebar>
        <AppShellMain className="p-4 text-sm text-muted-foreground">Map view</AppShellMain>
      </AppShellBody>
    </AppShell>
  )
}
```

## Aside

`AppShellAside` is a 320 px right column for tool panels; combine it with [Panel](/docs/tecton/panel.md).

**Example — `app-shell-aside`**

```tsx
import { HexagonIcon } from "lucide-react"

import {
  AppShell,
  AppShellAside,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellMain,
} from "@tecton/react/tecton/app-shell"
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@tecton/react/tecton/panel"
import { Stat, StatLabel, StatValue } from "@tecton/react/tecton/stat"

export default function AppShellAsideExample() {
  return (
    <AppShell className="h-72 w-full max-w-3xl overflow-hidden rounded-lg border">
      <AppShellHeader>
        <AppShellBrand>
          <HexagonIcon />
          Tecton
        </AppShellBrand>
      </AppShellHeader>
      <AppShellBody>
        <AppShellMain className="p-4 text-sm text-muted-foreground">Seismic section</AppShellMain>
        <AppShellAside className="w-64 gap-2 p-2">
          <Panel variant="flat" size="sm">
            <PanelHeader>
              <PanelTitle>Selected well</PanelTitle>
            </PanelHeader>
            <PanelContent className="flex gap-6">
              <Stat size="sm">
                <StatLabel>TD</StatLabel>
                <StatValue unit="m">3 250</StatValue>
              </Stat>
              <Stat size="sm">
                <StatLabel>Picks</StatLabel>
                <StatValue>12</StatValue>
              </Stat>
            </PanelContent>
          </Panel>
        </AppShellAside>
      </AppShellBody>
    </AppShell>
  )
}
```

## Resizable split

Wrap the main area and a full-height aside in `AppShellSplit`, each inside an `AppShellSplitPanel`, with an `AppShellSplitHandle` between them; the user drags the divider to resize. Sizes take the [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) units (`"320px"`, `"25%"`, `"20rem"`). Give the aside `h-full w-full border-l-0`, since the handle draws the divider.

**Example — `app-shell-split`**

```tsx
import { HexagonIcon } from "lucide-react"

import {
  AppShell,
  AppShellAside,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellMain,
  AppShellSplit,
  AppShellSplitHandle,
  AppShellSplitPanel,
} from "@tecton/react/tecton/app-shell"
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@tecton/react/tecton/panel"

export default function AppShellSplitExample() {
  return (
    <AppShell className="h-72 w-full max-w-3xl overflow-hidden rounded-lg border">
      <AppShellHeader>
        <AppShellBrand>
          <HexagonIcon />
          Tecton
        </AppShellBrand>
      </AppShellHeader>
      <AppShellBody>
        <AppShellSplit>
          <AppShellSplitPanel minSize="40%">
            <AppShellMain className="p-4 text-sm text-muted-foreground">
              Drag the divider to resize the aside.
            </AppShellMain>
          </AppShellSplitPanel>
          <AppShellSplitHandle />
          <AppShellSplitPanel defaultSize="240px" minSize="160px" maxSize="60%">
            <AppShellAside className="h-full w-full border-l-0">
              <Panel className="h-full rounded-none border-0">
                <PanelHeader>
                  <PanelTitle>Properties</PanelTitle>
                </PanelHeader>
                <PanelContent className="text-sm text-muted-foreground">
                  Tool panel content
                </PanelContent>
              </Panel>
            </AppShellAside>
          </AppShellSplitPanel>
        </AppShellSplit>
      </AppShellBody>
    </AppShell>
  )
}
```

Render the aside panel only on wide viewports: `useMinWidth(1280)` returns whether the viewport is at least that wide, so a narrow screen gets the main area alone instead of a squeezed split.

```tsx
const showAside = useMinWidth(1280)

<AppShellSplit>
  <AppShellSplitPanel minSize="40%">
    <AppShellMain>…</AppShellMain>
  </AppShellSplitPanel>
  {showAside && (
    <>
      <AppShellSplitHandle />
      <AppShellSplitPanel defaultSize="384px" minSize="280px" maxSize="50%">
        <AppShellAside className="h-full w-full border-l-0">…</AppShellAside>
      </AppShellSplitPanel>
    </>
  )}
</AppShellSplit>
```

## API Reference

### AppShellSplit, AppShellSplitPanel, AppShellSplitHandle

Styled [Resizable](/docs/components/resizable.md) group, panel and handle; accept all their props (`orientation`, `defaultSize`, `minSize`, `maxSize`, `collapsible`, `onResize`, …).

### useMinWidth

`useMinWidth(minWidth: number): boolean` — true when the viewport is at least `minWidth` px wide; false during server rendering.

### AppShell

Grid with the header row and the body; fills the viewport (`h-svh`).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | - | Override the height in embedded contexts. |

### AppShellHeader, AppShellBrand, AppShellNav, AppShellHeaderActions, AppShellBody, AppShellSidebar, AppShellMain, AppShellAside

Plain styled layout elements.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | - |  |
