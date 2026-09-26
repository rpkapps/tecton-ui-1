---
component: TectonProvider
module: "@tecton/react/tecton/provider"
family: infrastructure
exports: [TectonProvider, useDirection, useLocale]
notFor:
  - need: the root of an independently deployed application, overlay container included
    use: ThemeRoot
  - need: a dark or light island inside the application
    use: ThemeRoot
  - need: a link that navigates with the router
    use: Link
related: [ThemeRoot, Link]
---

## Use it when

- Any Tecton application: mounted once at the root, it carries the locale, the reading direction and the client-side router every component reads.
- The application, or one subtree, reads right to left or in another language than the browser's.
- Overlays have to portal into a particular element instead of `document.body`.

## Do

- Mount one `TectonProvider` above the router outlet and set the same `dir` and `lang` on `<html>`, so the document's own text flow and scrollbars match.
- Pass `locale` when you have one — it sets the direction too — and `direction` only to override it.
- Hand the router over once with `navigate` and `useHref`; Tecton links then navigate without a page load and still open in a new tab on ⌘/Ctrl-click.
- Nest a second provider for a subtree that differs: it inherits every value it does not set.
- Read the direction with `useDirection()` (`"ltr" | "rtl"`) in components of your own, never from `document.dir`.

## Don't

### HIGH A component library's own provider instead of TectonProvider

Wrong:

```tsx
import { DirectionProvider } from "@base-ui/react/direction-provider"

<DirectionProvider direction="rtl">
  <App />
</DirectionProvider>
```

Correct:

```tsx
import { TectonProvider } from "@tecton/react/tecton/provider"

<TectonProvider locale="ar-EG">
  <App />
</TectonProvider>
```

Tecton components read the Tecton context, so a provider imported from a library Tecton is built on reaches at most the components built on that library, and the others — the tree view, `useDirection()` — stay left to right.

### HIGH The router's navigate passed through unchanged

Wrong:

```tsx
<TectonProvider navigate={router.navigate}>
  <App />
</TectonProvider>
```

Correct:

```tsx
<TectonProvider
  navigate={(href, options) => router.navigate({ to: href, ...(options as object) })}
  useHref={(href) => router.buildLocation({ to: href }).href}
>
  <App />
</TectonProvider>
```

`navigate` is called with the link's `href` string, while TanStack Router's `navigate` takes an options object, so the string is read as options without a `to` and every link click lands on the current page.

### MEDIUM document.body as the portal container of a mounted remote

Wrong:

```tsx
<TectonProvider portalContainer={document.body}>
  <AssetTracker />
</TectonProvider>
```

Correct:

```tsx
<ThemeRoot className="mfe-a">
  <AssetTracker />
</ThemeRoot>
```

A remote's utilities are wrapped in `@scope (.mfe-a) to ([data-tecton-root])`, so its overlays have to land in a container carrying that class and marker; `ThemeRoot` creates, syncs and removes one and passes it to its own `TectonProvider`.
