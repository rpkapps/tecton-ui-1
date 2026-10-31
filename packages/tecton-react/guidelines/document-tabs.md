---
component: DocumentTabs
module: "@tecton/react/tecton/document-tabs"
family: navigation
exports: [DocumentTabs, DocumentTabsList, DocumentTabsTrigger, DocumentTabsLabel, DocumentTabsClose, DocumentTabsAdd, DocumentTabsMore, DocumentTabsMenu, DocumentTabsMenuRename, DocumentTabsMenuClose, DocumentTabsMenuCloseOthers, DocumentTabsContent, documentTabsListVariants]
notFor:
  - need: a fixed set of sections of one page or panel
    use: Tabs
  - need: the application frame around the workspace
    use: AppShell
related: [Tabs, PageHeader, AppShell]
---

## Use it when

- The user opens documents into a workspace and keeps several open at once: wells, views of a well, reports.
- The user closes, renames or reorders those open documents, the way a browser treats its tabs.
- Open documents can outnumber the room in the row, so the extra ones move into a More menu.

## Do

- Keep the open documents in application state and render one `DocumentTabsTrigger` and one `DocumentTabsContent` per document, matched by `value`.
- Update that state from `onClose`, `onRename` and `onReorder` on `DocumentTabs`; leave a callback out to turn its action off.
- Compose a tab from an icon, `DocumentTabsLabel` (what rename edits and the More menu shows), an optional `Badge`, and `DocumentTabsClose` last; leave the close out to pin a tab.
- Name the strip with `aria-label` on `DocumentTabsList`, add `DocumentTabsAdd` with an `onClick` that creates and opens a document, and nest a second strip at `size="sm"`.

## Don't

### CRITICAL Nesting a close button in the trigger

Wrong:

```tsx
<TabsTrigger value={well.id}>
  {well.name}
  <Button size="icon-xs" onClick={() => close(well.id)}><XIcon /></Button>
</TabsTrigger>
```

Correct:

```tsx
<DocumentTabsTrigger value={well.id}>
  <DocumentTabsLabel>{well.name}</DocumentTabsLabel>
  <DocumentTabsClose />
</DocumentTabsTrigger>
```

A button inside a tab is invalid markup that screen readers flatten; `DocumentTabsClose` sits beside the tab, and Delete closes the focused one.

### HIGH Hiding tabs with your own overflow

Wrong:

```tsx
<DocumentTabsList className="overflow-x-auto">{tabs}</DocumentTabsList>
```

Correct:

```tsx
<DocumentTabsList aria-label="Open wells">{tabs}</DocumentTabsList>
```

The list measures itself and moves the tabs that do not fit into its More menu while keeping the open one visible; a scrolling row hides tabs that neither the arrow keys nor a menu reach.
