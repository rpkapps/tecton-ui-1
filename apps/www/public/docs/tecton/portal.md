# Portal Provider

Chooses the element that Tecton overlays portal into. For pages that render several isolated React roots.

Source: /docs/tecton/portal.md

## Usage

```tsx
import { PortalProvider } from "@tecton/react/tecton/portal"
```

```tsx
<PortalProvider container={overlayRoot}>
  <App />
</PortalProvider>
```

Every Tecton overlay — `Dialog`, `Sheet`, `Popover`, `Tooltip`, `Select`, `Combobox`, `DropdownMenu`, `CommandDialog` — portals into `document.body` by default. `PortalProvider` changes that target for its whole subtree without any prop on the overlays themselves.

## When to use it

Applications that render **several isolated React roots on one page** (micro frontends, embedded widgets) give each root a body-level container of its own. The overlays still escape any `overflow: hidden` ancestor, while the container carries that root's scoped styles, theme tokens and ownership attributes:

```tsx
const overlayRoot = document.createElement("div")
overlayRoot.setAttribute("data-mfe", "asset-tracker")
document.body.append(overlayRoot)

createRoot(mountNode).render(
  <PortalProvider container={overlayRoot}>
    <AssetTracker />
  </PortalProvider>
)
```

A single-root application does not need it.

## Notes

- The provider is a narrow adapter over React Aria's portal context (`UNSAFE_PortalProvider` from `react-aria`). It patches nothing: not the DOM, not `document.body`, not React portals.
- `@tecton/react` pins the same `react-aria` version as `react-aria-components` so both resolve to one module instance; keep the two in step when updating.
- `Drawer` is built on Base UI, which has no portal context; it keeps portalling into `document.body`.
- `container={null}` clears an outer provider and restores the default.

## API Reference

### PortalProvider

| Prop        | Type                                                 | Default | Description                                                                                            |
| ----------- | ---------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `container` | `HTMLElement \| null \| (() => HTMLElement \| null)` | -       | Element the overlays portal into. A function is called on every open. `null` restores `document.body`. |
| `children`  | `ReactNode`                                          | -       | Subtree whose overlays are redirected.                                                                 |

### usePortalContainer

`usePortalContainer(): HTMLElement | null` — the current portal container, or `null` when React Aria will use `document.body`.
