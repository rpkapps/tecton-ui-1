---
component: Breadcrumb
module: "@tecton/react/components/breadcrumb"
family: navigation
exports: [Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis]
notFor:
  - need: switching between sibling views of the same page
    use: Tabs
  - need: section tabs under a page title
    use: PageHeaderNav
  - need: moving through the pages of one list
    use: Pagination
related: [PageHeader, Tabs, Pagination]
---

## Use it when

- The path from the application root down to the record on screen, one link per level.
- The trail is the eyebrow of a page title block, above the `PageHeaderTitle`.
- A deep path has to collapse in the middle, behind an ellipsis or a menu.

## Do

- Compose `Breadcrumb` > `BreadcrumbList` > `BreadcrumbItem`, and end the trail with `BreadcrumbPage` — the `span` carrying `aria-current="page"`, never a link restyled to look current.
- Put a `BreadcrumbSeparator` between items: it is the presentational `li` holding the chevron (flipped in right-to-left); pass a child to change the glyph.
- Give `BreadcrumbLink` an `href`, and mount a routing library's link with `render={<Link to="/fields" />}`.
- Collapse the middle with `BreadcrumbEllipsis`, or put it in a `DropdownMenuTrigger` when those levels must stay reachable.

## Don't

### CRITICAL A trail hand-built from anchors and slashes

Wrong:

```tsx
<nav className="flex items-center gap-2 text-sm text-zinc-500">
  <a href="/fields">Fields</a>
  <span>/</span>
  <span className="text-zinc-900">Gullfaks</span>
</nav>
```

Correct:

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/fields">Fields</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Gullfaks</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

`zinc` is not a Tecton palette family, so both colour classes emit no CSS, and the row has none of the structure a breadcrumb is read by: `Breadcrumb` is the `nav[aria-label="breadcrumb"]`, `BreadcrumbList` the `ol`, `BreadcrumbItem` the `li`, and `BreadcrumbPage` the element marked `aria-current="page"`.

### HIGH asChild to mount the routing library's link

Wrong:

```tsx
<BreadcrumbLink asChild>
  <Link to="/fields/gullfaks">Gullfaks</Link>
</BreadcrumbLink>
```

Correct:

```tsx
<BreadcrumbLink render={<Link to="/fields/gullfaks" />}>Gullfaks</BreadcrumbLink>
```

There is no `asChild`: `BreadcrumbLink` renders its own `a` and the routing link is nested inside it, a link inside a link with two tab stops per level.

### MEDIUM Separators typed between the items

Wrong:

```tsx
<BreadcrumbList>
  <BreadcrumbItem><BreadcrumbLink href="/fields">Fields</BreadcrumbLink></BreadcrumbItem>
  <span>/</span>
  <BreadcrumbItem><BreadcrumbPage>Gullfaks</BreadcrumbPage></BreadcrumbItem>
</BreadcrumbList>
```

Correct:

```tsx
<BreadcrumbList>
  <BreadcrumbItem><BreadcrumbLink href="/fields">Fields</BreadcrumbLink></BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem><BreadcrumbPage>Gullfaks</BreadcrumbPage></BreadcrumbItem>
</BreadcrumbList>
```

A bare `span` inside the `ol` is invalid list content and is read aloud as "slash"; `BreadcrumbSeparator` is an `li` with `role="presentation"` and `aria-hidden`, sized and flipped for right-to-left.
