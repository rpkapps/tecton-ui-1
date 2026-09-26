---
title: "Colour, tokens, dark and light mode, ThemeRoot, micro-frontends"
description: >
  How colour reaches the screen in @tecton/react and what an application may and
  may not change. Covers the shadcn CSS variables (--background, --primary,
  --ring, --success-surface, --border-strong) as the only carrier of the theme
  and their generation from tokens/tecton.map.json, why an application never
  declares a --color-* and a missing colour is a token request, the fifteen
  contrast ramps and how to read a step (bg-blue-120 text-blue-830, steps 50 to
  1570, no dark: pair), dark-first with the dark class on html, inverting a
  section with the light or dark class, ThemeRoot with theme="inherit" | "dark" |
  "light" for an independently deployed application, and micro-frontends with
  @tecton/react/styles/scoped.css, the @tecton/react/postcss/scope plugin and
  @tecton/react/federation/shared. Load when picking a colour, adding a token,
  toggling or inverting the mode, retinting a subtree, or mounting one Tecton
  application inside another.
sources:
  - "../../apps/www/content/docs/theming.mdx"
  - "../../apps/www/content/docs/micro-frontends.mdx"
  - "../../apps/www/content/docs/tecton/theme-root.mdx"
  - "../../README.md"
  - "src/tecton/theme-root.tsx"
  - "postcss/scope.mjs"
  - "tokens/tecton.map.json"
---

# Theming

This builds on `tecton rules`. Read it first for the import paths
and the rule that variants own colour.

Only the **shadcn CSS variables** carry the Tecton visual language. No CSS
targets the generated components, and the components themselves are never
edited. `tokens/tecton.map.json` says which Tecton token each variable takes,
`tokens:build` writes the values into `globals.css`, and `tokens:check`
verifies completeness and WCAG contrast for every surface/foreground pair. An
application therefore declares no colours of its own: a colour the palette does
not cover is a change to the Tecton token export, not to the app stylesheet.

## Setup

An application that owns the document needs one import and one class:

```css title="src/styles/app.css"
@import "@tecton/react/globals.css";
```

```tsx title="src/app.tsx"
import { ThemeProvider } from "next-themes"

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

`dark` on `<html>` selects the dark mode; `data-theme="dark"` on the document
root does the same. Both modes come from the Tecton export and both are exact —
`--background` is `var(--tecton-color-bg-default)` in `:root` and in `.dark`,
and the token file switches the value.

## Reading the palette

Fifteen families — `azure blue graphite gray green lemon lilac lime mauve orchid
pink red saffron violet yellow` — each with twenty-three steps from `50` (barely
off the page background) to `1570` (maximum contrast). A step is a **contrast
level**, not a lightness, and it carries a separate value per mode, so one
utility serves both and a palette step never takes a `dark:` pair.

| Recipe | Classes |
| --- | --- |
| Tinted surface with readable text | `bg-blue-120 text-blue-830` |
| Solid fill with light text | `bg-green-560 text-green-50` |
| Coloured text or icon on the page | `text-red-560` |
| Border on a tinted surface | `border-yellow-160` |
| Translucency | the opacity modifier, `bg-gray-370/20` |

Prefer a semantic token whenever one exists — `bg-primary`, `bg-card`,
`text-muted-foreground`, `text-success`, `bg-warning-surface`, `bg-surface-alt`,
`border-border-subtle`, `border-border-strong`, `text-destructive-foreground` —
and reach for a step only for what has no semantic: a chart series, a tag
colour, a custom badge. The semantic variables are literal picks from these
ramps, which is what makes the two interchangeable.

## Inverting a section

Put `light` or `dark` on any element and everything below it follows:
`color-scheme`, the raw `--tecton-*` tokens, the palette ramps, the shadcn
variables and the `dark:` utilities.

```tsx
<div className="light rounded-lg bg-background p-6 text-foreground">
  <h2 className="text-lg font-medium">Report preview</h2>
  <p className="text-muted-foreground">A light panel in a dark page.</p>
</div>
```

The block inverts completely, in either direction. Nest a third marker inside
and its variables still follow it, while its `dark:` utilities read the
inversion above. Inside a page use the class — `data-theme="dark"` switches a
whole document, not a subtree.

## ThemeRoot: an independently deployed application

An application that owns its document needs nothing here. `ThemeRoot` is for one
mounted into a page that already has its own copy of Tecton — a Module
Federation remote, an embedded widget.

```tsx title="src/mount.tsx"
import { createRoot } from "react-dom/client"
import { ThemeRoot } from "@tecton/react/tecton/theme-root"

import "./styles/remote.css"

export function mount(element: HTMLElement) {
  const root = createRoot(element, { identifierPrefix: "mfe-a" })
  root.render(
    <ThemeRoot className="mfe-a" theme="inherit">
      <App />
    </ThemeRoot>
  )
  return () => root.unmount()
}
```

It marks its element with `data-tecton-root` — the selector `scoped.css` keys on
— and appends one body-level overlay container carrying the same classes, which
every Tecton overlay (`Dialog`, `Sheet`, `AlertDialog`, `Popover`, `HoverCard`,
`Tooltip`, `Select`, `Combobox`, `DropdownMenu`, `ContextMenu`, `Drawer`)
portals into. It declares no theme variables: `theme="inherit"` (the default)
lets the shell's `--primary`, palette, radii and current mode inherit, so a
tenant switch or a mode toggle in the shell repaints the remote with it.
`theme="dark"` or `theme="light"` pins the subtree instead — a map or a log
viewer in a light shell — overlays included.

Per-root retinting is an arbitrary property in `className`, which reaches the
overlay container too:

```tsx
<ThemeRoot className="mfe-a [--primary:var(--tecton-palette-green-560)]">
  <App />
</ThemeRoot>
```

## Micro-frontends: scoped utilities

The shell keeps its plain `globals.css`. The remote compiles utilities only and
scopes them around its own root, so two copies of the library in one document
stop repainting each other.

```css title="src/styles/remote.css"
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
@import "@tecton/react/styles/scoped.css";
@source "./src/**/*.{ts,tsx}";
```

```js title="postcss.config.mjs"
import tailwindcss from "@tailwindcss/postcss"

import scopeTecton from "@tecton/react/postcss/scope"

export default { plugins: [tailwindcss(), scopeTecton({ scope: ".mfe-a" })] }
```

The plugin runs **after** `@tailwindcss/postcss` and wraps the sheet in
`@scope (.mfe-a) to ([data-tecton-root])`, so the cascade decides by scope
proximity instead of injection order. Options: `scope` (required),
`boundary` (default `"[data-tecton-root]"`, or `false`), `rootRules`
(`"scope"` rewrites a leading `:root` / `html` / `body` to `:scope`), and
`keyframes` (renames this sheet's own frames `<name>--mfe-a`).

The same scope selector is used in exactly three places: this option,
`ThemeRoot`'s `className`, and the React root's `identifierPrefix`.

Module Federation entries ship as data, so nothing is transcribed by hand:

```js title="rspack.config.mjs"
import { dependencies } from "./package.json" with { type: "json" }
import { shared } from "@tecton/react/federation/shared"

const requiredVersion = (name) => dependencies[name.replace(/\/$/, "")]

new ModuleFederationPlugin({
  shared: Object.fromEntries(
    Object.entries(shared).map(([name, policy]) => [
      name,
      { ...policy, requiredVersion: requiredVersion(name) },
    ])
  ),
})
```

None of the entries is a singleton, so applications on different React or
Tecton versions can share a page: `@tecton/react/` is a prefix share, and
`react`, `react-dom`, `sonner`, `react-aria-components` and `recharts` are
shared without being singletons (pin `react` and `react-dom` to the same exact
version in each application).
The list carries no versions — those come from the application's own install.
The host mounts exactly one `Toaster` and passes its `toast` to each remote
through the mount props; a remote mounts no `Toaster` and never imports `toast`
from `sonner`.

A remote with **no** Tecton shell to inherit from adds
`@tecton/react/styles/scoped-theme.css` after `scoped.css` and loads Figtree and
IBM Plex Mono itself. Leave it out whenever there is a shell: it declares the
full variable set on the remote's root and stops it following the host.

## Common Mistakes

### [CRITICAL] Declaring a --color-* in the application stylesheet

Wrong:

```css title="src/styles/app.css"
@import "@tecton/react/globals.css";

@theme {
  --color-brand-500: #2f7ae5;
}
```

Correct:

```tsx
<span className="rounded-sm bg-blue-120 px-2 py-0.5 text-xs text-blue-830">
  Simulation
</span>
```

The palette is the Tecton token export and `globals.css` is generated inside the
package, so a colour invented in an application is off-ramp, has no second value
for the other mode and has passed no contrast check — and once it is declared
in the application's own stylesheet, Tailwind generates it and nothing
distinguishes it from a sanctioned token. A genuinely uncovered colour is an
entry in `tokens/tecton.map.json`, raised with the design system.

Source: apps/www/content/docs/theming.mdx (Palette)

### [HIGH] A dark: pair on a palette step

Wrong:

```tsx
<div className="bg-blue-120 text-blue-830 dark:bg-blue-830 dark:text-blue-120">
  Horizon locked
</div>
```

Correct:

```tsx
<div className="bg-blue-120 text-blue-830">Horizon locked</div>
```

A step is a contrast level whose value already switches with the mode, so the
`dark:` half inverts an already-inverted pair: the dark theme gets a deep
background under deep text and the contrast collapses.

Source: apps/www/content/docs/theming.mdx (Palette); packages/tecton-react/tokens/tecton.map.json (palette.note)

### [HIGH] Overriding a shadcn variable with an inline style

Wrong:

```tsx
<div style={{ "--primary": "#22c55e" } as React.CSSProperties}>
  <App />
</div>
```

Correct:

```tsx
<ThemeRoot className="[--primary:var(--tecton-palette-green-560)]">
  <App />
</ThemeRoot>
```

A raw hex has no value for the other mode and no contrast check, and an inline
style never reaches the body-level overlay container, so every `Dialog`,
`Select` and `Tooltip` the subtree opens keeps the untinted `--primary` — the
arbitrary-property class on `ThemeRoot` is mirrored onto that container.

Source: apps/www/content/docs/tecton/theme-root.mdx (Notes); packages/tecton-react/src/tecton/theme-root.tsx:90

### [HIGH] globals.css inside an embedded remote

Wrong:

```css title="src/styles/remote.css"
@import "@tecton/react/globals.css";
```

Correct:

```css title="src/styles/remote.css"
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
@import "@tecton/react/styles/scoped.css";
@source "./src/**/*.{ts,tsx}";
```

`globals.css` carries the preflight, the fonts and the full variable set on
`:root`, so a remote that imports it resets the document its host owns and pins
its own token values over the shell's — a tenant customisation or a mode toggle
in the shell then stops reaching the remote.

Source: apps/www/content/docs/micro-frontends.mdx (Write the stylesheet entry); README.md

### [MEDIUM] ThemeRoot as the root of a standalone application

Wrong:

```tsx
import "@tecton/react/styles/scoped.css"

import { ThemeRoot } from "@tecton/react/tecton/theme-root"
import { createRoot } from "react-dom/client"

createRoot(document.getElementById("root")!).render(
  <ThemeRoot theme="dark">
    <App />
  </ThemeRoot>
)
```

Correct:

```tsx
import "@tecton/react/globals.css"

import { createRoot } from "react-dom/client"

createRoot(document.getElementById("root")!).render(<App />)
```

```html
<html class="dark">
```

`ThemeRoot` declares no theme variables at all — it only puts the mode class on
its element, marks it `data-tecton-root` and owns the overlay container — so an
application that owns its document and relies on it renders with no
`--background`, `--primary` or palette defined anywhere.

Source: apps/www/content/docs/tecton/theme-root.mdx (When to use it); packages/tecton-react/src/tecton/theme-root.tsx:38
