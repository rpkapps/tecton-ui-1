# @tecton/react

The Tecton design system for React: shadcn/ui components themed with Tecton tokens, plus Tecton components and oil & gas icons.

**Repository:** https://github.com/rpkapps/tecton-ui-1 · [CHANGELOG](https://github.com/rpkapps/tecton-ui-1/blob/dev/CHANGELOG.md)

## Install

The package is private: it is not on the public npm registry. Consume it as a workspace package, a packed tarball or through a private registry.

```bash
# pnpm workspace: "@tecton/react": "workspace:*" in the app's package.json
# tarball: pack it (prepack builds dist/ first), then add the file
pnpm --filter @tecton/react pack --pack-destination ./dist
pnpm add ./path/to/tecton-react-0.1.0.tgz
```

With a private registry, point the `@tecton` scope at it in the consuming project's `.npmrc` and run `pnpm add @tecton/react`. Pre-releases are on the `next` tag.

Requires React 19, Tailwind CSS v4, a bundler that resolves `package.json` `exports`, and TypeScript `"moduleResolution": "bundler"` (or `node16` / `nodenext`).

## Set up a micro-frontend

A remote (Module Federation remote, embedded widget) is mounted into a Tecton shell that owns the document, fonts and theme. The remote brings its own copy of the package and scopes its CSS to its own root. Full guide: [Micro-frontends](https://github.com/rpkapps/tecton-ui-1/blob/dev/apps/www/content/docs/micro-frontends.mdx).

1. **Render `ThemeRoot`** around the mounted tree, with one scope class per deployable, reused as the React root's `identifierPrefix`. It also acts as the remote's `TectonProvider` (`dir`, `locale`, `theme`).

   ```tsx
   import { createRoot } from "react-dom/client"
   import { ThemeRoot } from "@tecton/react/theme-root"

   import "./styles/remote.css"

   export function mount(element: HTMLElement, props: MountProps) {
     const root = createRoot(element, { identifierPrefix: "mfe-a" })
     root.render(
       <ThemeRoot className="mfe-a">
         <App {...props} />
       </ThemeRoot>
     )
     return () => root.unmount()
   }
   ```

2. **Import utilities only.** No preflight, variables or fonts: the shell provides them.

   ```css
   /* src/styles/remote.css */
   @layer theme, base, components, utilities;
   @import "tailwindcss/theme.css" layer(theme);
   @import "tailwindcss/utilities.css" layer(utilities);
   @import "@tecton/react/styles/scoped.css";
   @source "./src/**/*.{ts,tsx}";
   ```

3. **Scope the output** with the PostCSS plugin, after Tailwind, using the same class:

   ```js
   // postcss.config.mjs
   import tailwindcss from "@tailwindcss/postcss"
   import scopeTecton from "@tecton/react/postcss/scope"

   export default { plugins: [tailwindcss(), scopeTecton({ scope: ".mfe-a" })] }
   ```

4. **Share modules** from `@tecton/react/federation/shared` in your `ModuleFederationPlugin`, taking each `requiredVersion` from your own `package.json`. Pin `react` and `react-dom` to the same exact version as the shell.

5. **Leave toasts to the host:** call the `toast` the host passes in its mount props instead of mounting a `Toaster`.

Scoped styles need Chrome/Edge 118+, Safari 17.4+ or Firefox 146+.

## Set up a shell or standalone app

Import the full stylesheet once. It includes Tailwind, the Tecton tokens and palette:

```css
@import "@tecton/react/globals.css";
```

With Vite, use `@tailwindcss/vite`. `globals.css` loads its fonts by relative URL, and under Vite `@tailwindcss/postcss` neither rewrites those URLs nor copies the font files, so they 404 in a production build. If a Vite application must keep `@tailwindcss/postcss`, run `postcss-import` and then `postcss-url` with `{ url: "rebase" }` before it. Rsbuild, Rspack and webpack need nothing extra.

Tecton is dark-first: put the `dark` class on `<html>` for the dark theme. Mount `TectonProvider` (`@tecton/react/provider`) at the root for a locale, right-to-left direction, client-side routing for links or a custom overlay container.

## Use

Every component, hook and utility is imported from its own path:

```tsx
import { Badge } from "@tecton/react/badge"
import { Button } from "@tecton/react/button"
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

Use semantic colour tokens (`bg-primary`, `text-muted-foreground`) or Tecton palette steps (`bg-blue-120`). Stock Tailwind colours such as `bg-red-500` produce no CSS.

## Add the skill to your AI agent

The package ships an agent skill that teaches your coding agent how to use Tecton. Add it from your application root:

1. Install the Intent CLI, which the agent uses to load the skill:

   ```bash
   pnpm add -D @tanstack/intent
   ```

2. Add an `intent` entry to your app's `package.json`:

   ```json
   {
     "intent": {
       "skills": ["@tecton/react"]
     }
   }
   ```

3. Run the installer:

   ```bash
   pnpm exec intent install
   ```

   It writes the skill-loading instructions into `AGENTS.md` (or into `CLAUDE.md`, `.cursorrules` or `.github/copilot-instructions.md` if one of them already has an Intent block). Nothing else needs to run: the agent loads the skill itself when it starts a task.

Commit the changes. The skill comes from `node_modules`, so it stays in step with the installed package version.

## Contributing

Development docs are in the [repository README](https://github.com/rpkapps/tecton-ui-1#readme).
