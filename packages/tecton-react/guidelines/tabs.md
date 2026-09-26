---
component: Tabs
module: "@tecton/react/components/tabs"
family: selection
exports: [Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants]
notFor:
  - need: a filter that narrows a list in place
    use: ToggleGroup
  - need: picking a value for a form field
    use: Select
related: [ToggleGroup, Select]
---

## Use it when

- A page or panel has two to about six sections the user moves between without navigating away.
- Exactly one section is visible at a time and each one is a real chunk of content.
- The strip belongs to the surface it sits on: a page header, a panel, a card.

## Do

- Match every `TabsTrigger` to its `TabsContent` by `value`, the same string on both.
- Select with `defaultValue` / `value` and `onValueChange`, which receives the tab's value.
- Choose the strip with `TabsList` `variant="default" | "line"`, and a side strip with `orientation="vertical"` on `Tabs`.
- Give `TabsList` an `aria-label` when no nearby heading names the set; disable one tab with `disabled`.
- Let the arrow keys select: moving focus to a tab shows its panel. Pass `activateOnFocus={false}` to `TabsList` when a panel is costly to render, so the arrow keys only move focus and Enter or Space selects.

## Don't

### CRITICAL selectedKey and id instead of value

Wrong:

```tsx
<Tabs defaultSelectedKey="overview" onSelectionChange={setView}>
  <TabsList>
    <TabsTrigger id="overview">Overview</TabsTrigger>
  </TabsList>
  <TabsContent id="overview"><Overview /></TabsContent>
</Tabs>
```

Correct:

```tsx
<Tabs defaultValue="overview" onValueChange={setView}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
  </TabsList>
  <TabsContent value="overview"><Overview /></TabsContent>
</Tabs>
```

A panel is paired with its tab by `value` and the change is reported through `onValueChange`; `selectedKey`, `onSelectionChange` and `id` are not Tabs props, so the handler never fires and no panel matches its tab.

### HIGH Rendering the panel yourself instead of TabsContent

Wrong:

```tsx
<Tabs value={view} onValueChange={setView}>
  <TabsList><TabsTrigger value="overview">Overview</TabsTrigger></TabsList>
</Tabs>
{view === "overview" ? <Overview /> : <Reports />}
```

Correct:

```tsx
<Tabs value={view} onValueChange={setView}>
  <TabsList><TabsTrigger value="overview">Overview</TabsTrigger></TabsList>
  <TabsContent value="overview"><Overview /></TabsContent>
</Tabs>
```

Only `TabsContent` gets the `tabpanel` role, the `aria-labelledby` back to its tab and the focusable container, so a hand-rolled panel leaves the tab announcing a relationship the page does not have.

### MEDIUM Hand-styling the selected tab with data-state

Wrong:

```tsx
<TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
  Overview
</TabsTrigger>
```

Correct:

```tsx
<TabsList variant="line">
  <TabsTrigger value="overview">Overview</TabsTrigger>
</TabsList>
```

The selected tab carries `data-active`, not `data-state="active"`, and the stock palette is reset so `bg-blue-600` emits no CSS; the selected colours belong to the `TabsList` variant.
