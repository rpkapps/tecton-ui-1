---
component: Link
module: "@tecton/react/tecton/link"
family: actions
exports: [Link, LinkButton, linkVariants]
notFor:
  - need: something that happens in place instead of navigation
    use: Button
  - need: the trail of parent pages above a page title
    use: Breadcrumb
related: [Button, LinkButton, TectonProvider]
---

## Use it when

- A word or phrase inside running text navigates somewhere: a well, a report, an external register (`Link`).
- A navigation target should look like a button: "Open well", "Back to wells" (`LinkButton`).
- The destination leaves the application and needs the external marker.

## Do

- Always pass `href`: both render a real `<a>`, so new-tab, copy-address and the status bar work.
- Choose colour with `variant="default" | "primary" | "muted" | "subtle"`; leave `size="inherit"` inside prose. `LinkButton` takes the `Button` `variant` and `size`.
- Mount `TectonProvider` with the router's `navigate` and `useHref`: plain clicks then navigate without a page load, ⌘/Ctrl/Shift-clicks and `target="_blank"` still go to the browser. Router options go in `navigateOptions`.
- Reach outside the app with `external`, and disable with `disabled` (no `href`, not focusable, `aria-disabled`).

## Don't

### HIGH A Link or LinkButton used to run an action

Wrong:

```tsx
<Link onClick={() => archive(well.id)}>Archive</Link>
```

Correct:

```tsx
<Button variant="link" onClick={() => archive(well.id)}>Archive</Button>
```

Without `href` the anchor is not a link at all: it is not focusable, has no role and promises navigation it cannot do.

### HIGH An anchor nested inside a Button

Wrong:

```tsx
<Button variant="secondary"><a href="/wells/34-10-A-12">Open well</a></Button>
```

Correct:

```tsx
<LinkButton variant="secondary" href="/wells/34-10-A-12">Open well</LinkButton>
```

A link inside a `button` is invalid markup and is announced and activated as a button; `LinkButton` is the anchor with the button styles.

### HIGH Hand-built target, rel and external icon

Wrong:

```tsx
<Link href="https://factpages.sodir.no" target="_blank">
  Sodir FactPages <ExternalLinkIcon />
</Link>
```

Correct:

```tsx
<Link href="https://factpages.sodir.no" external>Sodir FactPages</Link>
```

`external` sets `target="_blank"` and `rel="noreferrer noopener"` together and appends the icon at the variant's `0.85em` size; a `rel` you pass as well (`nofollow`) is added to those two. `target="_blank"` alone leaves the opened page a handle on `window.opener`.

### MEDIUM Colouring the link with className

Wrong:

```tsx
<Link href="/wells/34-10-A-12" className="text-blue-600 underline">34/10-A-12</Link>
```

Correct:

```tsx
<Link href="/wells/34-10-A-12" variant="primary">34/10-A-12</Link>
```

The variant owns the colour and when the underline appears, and Tailwind's stock palette is reset here, so `text-blue-600` emits no CSS.
