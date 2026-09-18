# Link

Inline text link on React Aria Link with default, primary, muted and subtle variants and an external-link icon.

Source: /docs/tecton/link.md  
React Aria docs: https://react-aria.adobe.com/Link

**Example — `link-demo`**

```tsx
import { Link } from "@tecton/react/tecton/link"

export default function LinkDemo() {
  return (
    <p className="max-w-md text-sm text-muted-foreground">
      The well design references{" "}
      <Link href="#" variant="primary">
        Alternative B
      </Link>{" "}
      as its base case. See the{" "}
      <Link href="#">FDA summary</Link> for the full comparison.
    </p>
  )
}
```

## Usage

```tsx
import { Link } from "@tecton/react/tecton/link"
```

```tsx
<Link href="/wells/34-10-A-12" variant="primary">
  34/10-A-12
</Link>
```

> The shadcn `Button` has a `link` variant for buttons that look like links; `Link` is the opposite: a real anchor for navigation. Use `buttonVariants` on an `<a>` when a link should look like a button.

## Variants

Use the `variant` prop. `subtle` is always underlined, the others underline on hover.

**Example — `link-variants`**

```tsx
import { Link } from "@tecton/react/tecton/link"

export default function LinkVariants() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      <Link href="#" variant="default">
        Default
      </Link>
      <Link href="#" variant="primary">
        Primary
      </Link>
      <Link href="#" variant="muted">
        Muted
      </Link>
      <Link href="#" variant="subtle">
        Subtle
      </Link>
      <Link href="#" isDisabled>
        Disabled
      </Link>
    </div>
  )
}
```

## Sizes

By default the link inherits the surrounding font size; use `size` to set it explicitly.

**Example — `link-sizes`**

```tsx
import { Link } from "@tecton/react/tecton/link"

export default function LinkSizes() {
  return (
    <div className="flex flex-wrap items-baseline gap-6">
      <Link href="#" size="sm">
        Small
      </Link>
      <Link href="#" size="md">
        Medium
      </Link>
      <Link href="#" size="lg">
        Large
      </Link>
      <span className="text-xl">
        Inherits{" "}
        <Link href="#" size="inherit" variant="subtle">
          the parent size
        </Link>
      </span>
    </div>
  )
}
```

## External

Set `isExternal` to open in a new tab with `rel="noreferrer noopener"` and append an icon.

**Example — `link-external`**

```tsx
import { Link } from "@tecton/react/tecton/link"

export default function LinkExternal() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      <Link href="https://factpages.sodir.no" isExternal>
        Sodir FactPages
      </Link>
      <Link href="https://react-aria.adobe.com/Link" isExternal variant="muted">
        React Aria Link
      </Link>
    </div>
  )
}
```

## API Reference

### Link

React Aria [`Link`](https://react-aria.adobe.com/Link); accepts all its props (`href`, `routerOptions`, `isDisabled`, `onPress`…).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"default" \| "primary" \| "muted" \| "subtle"` | "default" | Colour and underline behaviour. |
| `size` | `"inherit" \| "sm" \| "md" \| "lg"` | "inherit" | Font size. |
| `isExternal` | `boolean` | false | Opens in a new tab and shows an icon. |
| `isDisabled` | `boolean` | false | Disables the link. |
