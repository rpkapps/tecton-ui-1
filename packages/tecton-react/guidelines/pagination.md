---
component: Pagination
module: "@tecton/react/components/pagination"
family: navigation
exports: [Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis]
notFor:
  - need: paging driven by a table's own sorting and filtering state
    use: TanStack Table
  - need: switching between sibling sections of one page
    use: Tabs
  - need: the rows-per-page picker beside the controls
    use: Select
related: [Table, Tabs]
---

## Use it when

- A list is served one page at a time and the user chooses which page.
- The page has to be a URL: bookmarked, shared, opened in a new tab, restored on reload.
- Only "previous" and "next" are wanted, next to a rows-per-page `Select`.

## Do

- Compose `Pagination` > `PaginationContent` > one `PaginationItem` per control.
- Mark the page with `isActive` on `PaginationLink`: it swaps `ghost` for `outline` and sets `aria-current="page"`.
- Give every control an `href`; `PaginationLink` is a plain `a` with the button look, so a press is a navigation, not a state change. At the first or last page leave `PaginationPrevious` / `PaginationNext` out: a link has no disabled state.
- Elide the middle with `PaginationEllipsis`, and relabel the ends with `text` on `PaginationPrevious` and `PaginationNext`.
- Keep `className` to placement (`mx-0 w-auto`); the controls own their size, shape and colour.

## Don't

### HIGH Page buttons wired to local state

Wrong:

```tsx
<div className="flex justify-center gap-1">
  {pages.map((number) => (
    <Button key={number} size="icon" variant={number === page ? "outline" : "ghost"} onClick={() => setPage(number)}>
      {number}
    </Button>
  ))}
</div>
```

Correct:

```tsx
<Pagination>
  <PaginationContent>
    {pages.map((number) => (
      <PaginationItem key={number}>
        <PaginationLink href={`?page=${number}`} isActive={number === page}>
          {number}
        </PaginationLink>
      </PaginationItem>
    ))}
  </PaginationContent>
</Pagination>
```

The hand-built row is a bare `div` with no `role="navigation"` and no `aria-label="pagination"`, and every page is a button rather than a URL, so nothing is shareable and `aria-current="page"` — which only `isActive` on `PaginationLink` sets — is never announced.

### MEDIUM The current page marked with className

Wrong:

```tsx
<PaginationLink href="?page=2" className="bg-blue-600 text-white">2</PaginationLink>
```

Correct:

```tsx
<PaginationLink href="?page=2" isActive>2</PaginationLink>
```

`PaginationLink` omits `variant` from its props on purpose — `isActive` is the one switch, and it sets both the `outline` variant and `aria-current="page"` — while `blue-600` is not a Tecton step, so the reset palette emits no rule and the marker is invisible as well as unannounced.

### MEDIUM A disabled prop on the control at either end

Wrong:

```tsx
<PaginationPrevious href="?page=0" isDisabled={page === 1} />
```

Correct:

```tsx
{page > 1 ? <PaginationPrevious href={`?page=${page - 1}`} /> : null}
```

`PaginationPrevious` renders an `a`, which has no disabled state: the prop lands on the DOM as an unknown attribute and the control stays a live link to a page that does not exist.
