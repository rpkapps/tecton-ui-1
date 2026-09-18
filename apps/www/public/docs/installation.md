# Installation

Add @tecton/react to your application. Blocks can be added with the shadcn CLI.

Source: /docs/installation.md

Tecton UI is consumed as the **package** `@tecton/react`: components, Tecton components, icons and the theme are all imported from it and are not installed one by one. **Blocks** are the exception: they are starting points meant to be copied into your application, so they are published in a shadcn registry.

## Package

`@tecton/react` is a private workspace package. It is not published to the public npm registry; consume it from the monorepo (`workspace:*`), from a packed tarball, or from a private registry.

**pnpm workspace**

Add the app to the workspace and reference the package:

```json title="apps/my-app/package.json"
{
  "dependencies": {
    "@tecton/react": "workspace:*"
  }
}
```

**Tarball**

Pack the library and install the tarball in any project (handy for quick local testing):

```bash
pnpm --filter @tecton/react pack --pack-destination ./dist
# in the consuming project
pnpm add ./path/to/tecton-react-0.0.0.tgz
```

**Private registry**

Run a private registry locally and publish there:

```bash
npx verdaccio
npm adduser --registry http://localhost:4873
pnpm --filter @tecton/react publish --registry http://localhost:4873 --no-git-checks
# consuming project
pnpm add @tecton/react --registry http://localhost:4873
```

### Peer requirements

- React 19
- Tailwind CSS v4 (the package ships Tailwind sources, not compiled CSS)
- A bundler that resolves `package.json` `exports` (Vite, Next.js, TanStack Start all do)

### Stylesheet

Import the theme once. It contains Tailwind, the shadcn runtime styles, the Tecton tokens and the theme variables:

```css title="src/styles/app.css"
@import "@tecton/react/globals.css";
```

The stylesheet already declares `@source` for the package and for `apps/**`; if your app lives elsewhere, add your own `@source` directive after the import.

### Dark mode

Tecton is dark-first. Add the `dark` class to `<html>` (for example with `next-themes` and `attribute="class"`). Without the class you get the Tecton light theme.

```tsx title="app.tsx"
import { ThemeProvider } from "next-themes"

export function App({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

### Usage

```tsx
import { Button } from "@tecton/react/components/button"
import { Badge } from "@tecton/react/components/badge"
import { WellIcon } from "@tecton/react/icons"

export function Example() {
  return (
    <div className="flex items-center gap-2">
      <Button>
        <WellIcon data-icon="inline-start" /> New well
      </Button>
      <Badge variant="success">Active</Badge>
    </div>
  )
}
```

## Frameworks

**Vite**

```ts title="vite.config.ts"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```tsx title="src/main.tsx"
import "./styles/app.css"
```

**TanStack Start**

This documentation site is a TanStack Start app. Import the stylesheet with `?url` in the root route:

```tsx title="src/routes/__root.tsx"
import appCss from "@tecton/react/globals.css?url"

export const Route = createRootRoute({
  head: () => ({ links: [{ rel: "stylesheet", href: appCss }] }),
})
```

**Next.js**

```tsx title="app/layout.tsx"
import "@tecton/react/globals.css"
```

Components that use hooks carry a `"use client"` directive already.

## Blocks (shadcn registry)

Blocks are full compositions (panels, dashboards, forms, tables) that you copy into your application and adapt. The docs site serves them as a shadcn registry named `@tecton`. Point your `components.json` at it and add a block with the CLI; the copied files import the components from `@tecton/react`, so the package must already be installed.

```json title="components.json"
{
  "registries": {
    "@tecton": "https://<your-docs-host>/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @tecton/dashboard-01
```

Every block on the [Blocks](/blocks) page shows its command. For a private host add `headers` to the registry entry (`"@tecton": { "url": "…", "headers": { "Authorization": "Bearer ${TECTON_TOKEN}" } }`).
