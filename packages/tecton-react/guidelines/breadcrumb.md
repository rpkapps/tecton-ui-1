---
component: Breadcrumb
module: "@tecton/react/components/breadcrumb"
family: navigation
exports: [Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbEllipsis]
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
- Let `BreadcrumbItem` draw the separator: it renders the chevron itself for every item React Aria does not mark `isCurrent`, and `separatorClassName` is how you size it.
- Give `BreadcrumbLink` an `href`, and a routing library's link through `render={(props) => <Link {...props} />}`.
- Collapse the middle with `BreadcrumbEllipsis`, or put it in a `DropdownMenuTrigger` when those levels must stay reachable.

## Don't

### CRITICAL A trail hand-built from anchors and slashes

Wrong:

```tsx
<nav className="flex items-center gap-2 text-sm text-zinc-500">
  <a href="/fields">Fields</a>
  <span>/</span>
  <a href="/fields/gullfaks">Gullfaks</a>
  <span>/</span>
  <span className="text-zinc-900">34/10-A-12</span>
</nav>
```

Correct:

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/fields">Fields</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="/fields/gullfaks">Gullfaks</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>34/10-A-12</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

`zinc` is not a Tecton palette family, so both colour classes emit no CSS under the reset palette, and the row has none of the structure a breadcrumb is read by: `Breadcrumb` is the `nav[aria-label="breadcrumb"]`, `BreadcrumbList` the `ol`, `BreadcrumbItem` the `li`, and `BreadcrumbPage` the element marked `aria-current="page"`.

### HIGH asChild to mount the routing library's link

Wrong:

```tsx
<BreadcrumbItem>
  <BreadcrumbLink asChild>
    <Link to="/fields/gullfaks">Gullfaks</Link>
  </BreadcrumbLink>
</BreadcrumbItem>
```

Correct:

```tsx
<BreadcrumbItem>
  <BreadcrumbLink href="/fields/gullfaks" render={(props) => <Link {...props} />}>
    Gullfaks
  </BreadcrumbLink>
</BreadcrumbItem>
```

`BreadcrumbLink` is a React Aria `Link`, which has `render` and no `asChild`, so the prop is dropped and the routing link is left nested inside it — and React Aria renders its own element as a `span[role="link"]` whenever it has no `href`, so the element it focuses, styles and marks current leads nowhere and the trail gains a second tab stop per level.
