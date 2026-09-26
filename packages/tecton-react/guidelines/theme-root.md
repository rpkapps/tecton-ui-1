---
component: ThemeRoot
module: "@tecton/react/tecton/theme-root"
family: infrastructure
exports: [ThemeRoot, themeRootVariants]
notFor:
  - need: the locale, direction or router of an application that owns the document
    use: TectonProvider
  - need: the header, rail and work area of an application that owns the document
    use: AppShell
related: [TectonProvider, AppShell]
---

## Use it when

- An application is mounted into a page that already carries its own copy of Tecton: a Module Federation remote, an embedded widget.
- A subtree must be pinned against the shell's mode — a dark map or log viewer in a light application.
- That subtree's overlays have to stay inside its own `@scope` rule instead of landing in a bare `document.body`.

## Do

- Render it around the whole mounted tree with the deployable's scope class, and keep layout on an inner element: `<ThemeRoot className="mfe-a"><div className="flex h-full flex-col">…</div></ThemeRoot>`. The overlay container that mirrors `className` is `display: contents`, so layout utilities do nothing there while typography and colour classes reach every overlay.
- Keep `theme="inherit"` inside a Tecton shell — the shell's variables, palette and mode inherit — and pin `dark` or `light` only for an inverted island.
- Retint one root with an arbitrary property in `className`: `[--primary:var(--tecton-palette-green-560)]`, which is mirrored onto the overlay container; pass `overlayClassName` instead when only some of the root's classes belong on the overlays (the theme class is always added to it).
- Pass `dir` and `locale` when the remote reads differently from its shell: `dir` lands on the root and on the overlay container, and both feed the `TectonProvider` it renders.
- Pass `overlayContainer` to reuse an element the shell owns, or `null` to opt out; omit it and the root creates, syncs and removes its own.

## Don't

### CRITICAL globals.css imported inside a mounted remote

Wrong:

```tsx
import "@tecton/react/globals.css"

createRoot(element).render(<App />)
```

Correct:

```tsx
import { ThemeRoot } from "@tecton/react/tecton/theme-root"

import "./styles/remote.css"

createRoot(element, { identifierPrefix: "mfe-a" }).render(
  <ThemeRoot className="mfe-a" theme="inherit">
    <App />
  </ThemeRoot>
)
```

`globals.css` carries preflight, the fonts and the whole variable set on `:root`, so a remote that imports it resets the document the shell owns and repaints the shell with the remote's version of the theme — a remote's sheet is `scoped.css`, scoped to the `data-tecton-root` marker `ThemeRoot` renders.

### HIGH A theme applied as inline CSS variables

Wrong:

```tsx
<div style={{ "--primary": "#2f7d32" } as React.CSSProperties}>
  <App />
</div>
```

Correct:

```tsx
<ThemeRoot className="mfe-a [--primary:var(--tecton-palette-green-560)]">
  <App />
</ThemeRoot>
```

Inline variables reach only the elements under that `div`, and every `Dialog`, `Select`, `Tooltip` and `DropdownMenu` portals out of it, so the overlays keep the shell's colours; `ThemeRoot` copies its `className` onto the body-level container it owns, which is what carries an override across the portal.

### MEDIUM The dark class toggled on a plain root element

Wrong:

```tsx
<div className={mode === "dark" ? "mfe-a dark" : "mfe-a"}>
  <App />
</div>
```

Correct:

```tsx
<ThemeRoot className="mfe-a" theme={mode === "dark" ? "dark" : "light"}>
  <App />
</ThemeRoot>
```

The mode class has to sit on the overlay container as well, or the subtree's portalled overlays render in the shell's mode; `themeRootVariants` and the sync effect are what put it on both and swap it when `mode` flips.
