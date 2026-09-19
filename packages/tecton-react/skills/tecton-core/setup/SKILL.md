---
name: setup
description: >
  Install and configure @tecton/react in an application. Load when adding
  Tecton to a project, wiring the stylesheet, fixing unstyled or unthemed
  output, setting up dark mode, or configuring the ESLint guardrails.
  @tecton/react is a private package consumed as a workspace dependency, a
  packed tarball or from a private registry — never from public npm. Covers
  the single globals.css import, the @source directive for Tailwind class
  detection, the dark-first theme toggle, peer requirements (React 19,
  Tailwind v4, a bundler that resolves exports), the components.json registry
  entry for blocks, and @tecton/eslint-config recommended vs strict.
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
sources:
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/installation.mdx'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/linting.mdx'
---

# Tecton UI — Setup

## Non-negotiables

True everywhere in Tecton, whichever skill you loaded.

1. **Stock Tailwind colours emit no CSS.** `globals.css` resets
   `--color-*: initial`, so `bg-red-500` and `text-zinc-400` produce no rule
   and render unstyled — no error, no fallback. Use a semantic token
   (`bg-primary`, `text-success`) or a palette step (`bg-blue-120`).
   Detail: `tecton-core/styling`.
2. **Props are React Aria's, not Radix's.** `onPress` not `onClick`; `is*`
   state props (`isDisabled`, `isSelected`, `isRequired`); `id` not `value`
   on Select, Tabs, Accordion, ToggleGroup and Menu items; no `asChild`.
   Detail: `tecton-core/components`.

## Install the package

`@tecton/react` is **private**. It is not on public npm — `npm install
@tecton/react` installs nothing or the wrong thing. Consume it one of three
ways:

```jsonc
// 1. Workspace (the normal case inside a Tecton monorepo)
{ "dependencies": { "@tecton/react": "workspace:*" } }
```

```bash
# 2. Packed tarball, for a quick external test
pnpm --filter @tecton/react pack --pack-destination ./dist
pnpm add ./dist/tecton-react-0.0.0.tgz

# 3. Private registry
pnpm add @tecton/react --registry https://<your-private-registry>
```

Peer requirements: **React 19**, **Tailwind CSS v4** (the package ships
Tailwind sources, not compiled CSS), and a bundler that resolves `package.json`
`exports` — Vite, Next.js and TanStack Start all do.

## Import the stylesheet once

```css title="src/styles/app.css"
@import "@tecton/react/globals.css";
```

This one import carries Tailwind, the shadcn runtime styles, the Tecton raw
tokens, the palette and the theme variables. Do not import
`tecton-tokens.css`, `tecton-palette.css` or `tecton-theme.css` separately —
`globals.css` already orders them, and importing them out of order breaks the
palette reset.

The stylesheet declares `@source` for the package and for `apps/**`. **If your
application lives anywhere else, add your own `@source` after the import** or
Tailwind never scans your files and emits no utilities for them:

```css
@import "@tecton/react/globals.css";
@source "../../src";
```

### Framework wiring

```ts title="vite.config.ts"
import tailwindcss from "@tailwindcss/vite"
export default defineConfig({ plugins: [react(), tailwindcss()] })
```

```tsx title="TanStack Start — src/routes/__root.tsx"
import appCss from "@tecton/react/globals.css?url"
export const Route = createRootRoute({
  head: () => ({ links: [{ rel: "stylesheet", href: appCss }] }),
})
```

```tsx title="Next.js — app/layout.tsx"
import "@tecton/react/globals.css"
```

## Dark mode

Tecton is **dark-first**. Put the `dark` class on `<html>` (or
`data-theme="dark"`, which the token file also honours):

```tsx
import { ThemeProvider } from "next-themes"

;<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
  {children}
</ThemeProvider>
```

Without the class you get the Tecton **light** theme — which is equally
complete, just not the product default.

## Guardrails

`@tecton/eslint-config` is the fastest way to keep an application — and an
agent — inside the design system. It catches the failures that are otherwise
silent.

```bash
pnpm add -D @tecton/eslint-config eslint @typescript-eslint/parser
```

```js title="eslint.config.js"
import tecton from "@tecton/eslint-config"
import tsParser from "@typescript-eslint/parser"

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  ...tecton.configs.recommended,
]
```

| Config        | Scope                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `recommended` | Tecton components only — `no-restyle`, `require-static-classes`, `no-restricted-imports`. Correct in every project layout. |
| `strict`      | Adds `no-raw-colors`, `no-unknown-classes`, `no-arbitrary-values`, `no-inline-styles` across **every** `className`. |

`strict` reads the project's resolved Tailwind theme through
`components.json`'s `tailwind.css`, and the linter does not read theme sources
from inside `node_modules`. Use it only where that stylesheet reaches the
Tecton CSS **outside** `node_modules` — an app in the Tecton workspace, or one
that vendors a copy. Everywhere else `strict` sees an empty theme and reports
every valid Tecton class as a raw colour.

## Blocks registry (optional)

Only needed if you copy blocks. Components never come from the registry.

```jsonc title="components.json"
{ "registries": { "@tecton": "https://<docs-host>/r/{name}.json" } }
```

```bash
npx shadcn@latest add @tecton/dashboard-01
```

## Common Mistakes

### CRITICAL Installing `@tecton/react` from public npm

Wrong:

```bash
npm install @tecton/react
```

Correct:

```jsonc
{ "dependencies": { "@tecton/react": "workspace:*" } }
```

The package is private and unpublished. Depending on registry configuration
this either fails outright or resolves to an unrelated package under the same
name — which then supplies none of the components the imports expect.

Source: `apps/www/content/docs/installation.mdx § Package`

### HIGH Tailwind emits nothing for the application's own files

Wrong:

```css
@import "@tecton/react/globals.css";
/* app lives in ./web/src, which globals.css does not @source */
```

Correct:

```css
@import "@tecton/react/globals.css";
@source "../../web/src";
```

Tailwind v4 discovers classes by scanning the files named by `@source`. The
shipped stylesheet covers the package and `apps/**` only. An application
outside those paths gets a stylesheet with the theme but none of its own
utilities — components look right, the surrounding layout does not.

Source: `apps/www/content/docs/installation.mdx § Stylesheet`

### HIGH `strict` on an app that installs Tecton from a registry

Wrong:

```js
export default [...tecton.configs.strict] // app consumes @tecton/react from node_modules
```

Correct:

```js
export default [...tecton.configs.recommended]
```

`strict`'s colour rules resolve the theme from `components.json`'s
`tailwind.css`, and the linter refuses to read theme sources inside
`node_modules`. It therefore sees an **empty** theme and flags every real
Tecton class — `bg-primary`, `bg-blue-120` — as a raw colour. The output is
pure noise, and the usual response is to switch the linter off entirely.

Source: `apps/www/content/docs/linting.mdx § Checking the whole project`

### MEDIUM Importing the individual token stylesheets

Wrong:

```css
@import "@tecton/react/styles/tecton-palette.css";
@import "@tecton/react/styles/tecton-tokens.css";
```

Correct:

```css
@import "@tecton/react/globals.css";
```

`globals.css` imports these in a specific order — the palette reset
(`--color-*: initial`) has to land before the ramps are declared. Importing
them by hand reverses that on some bundlers, leaving stock Tailwind colours
partly alive and the Tecton steps missing.

Source: `apps/www/content/docs/theming.mdx § How it works`
