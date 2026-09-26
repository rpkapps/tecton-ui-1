---
component: ToggleGroup
module: "@tecton/react/components/toggle-group"
family: selection
exports: [ToggleGroup, ToggleGroupItem]
notFor:
  - need: switching between panels of content
    use: Tabs
  - need: a single independent on/off control
    use: Toggle
  - need: buttons that perform actions rather than hold state
    use: ButtonGroup
related: [Toggle, Tabs, ButtonGroup]
---

## Use it when

- A small fixed set of options works as a filter or a formatting control in a toolbar.
- Several of those options may be on at the same time (`multiple`).
- The options are icons or one-word labels that fit in a segmented row.

## Do

- Identify each item by `value`; read `value` / `defaultValue` and `onValueChange`, which always hand you an **array** of values.
- Leave it single-select for an exclusive choice, add `multiple` for independent toggles.
- Shape the bar with `variant="outline"`, `size` and `spacing={0}`; the joined corners and shared borders come from the variant.
- Give every icon-only `ToggleGroupItem` an `aria-label`, and stack with `orientation="vertical"`.

## Don't

### CRITICAL Radix or React Aria selection props

Wrong:

```tsx
<ToggleGroup type="single" selectedKeys={[weight]} onSelectionChange={setWeight}>
  <ToggleGroupItem id="bold">Bold</ToggleGroupItem>
</ToggleGroup>
```

Correct:

```tsx
<ToggleGroup value={[weight]} onValueChange={([next]) => next && setWeight(next)}>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
</ToggleGroup>
```

Items are identified by `value` and the group reports an array through `onValueChange`; `type`, `selectedKeys`, `onSelectionChange` and `id` are not props here, so the group renders but never records a selection.

### HIGH A toggle group used to switch content panels

Wrong:

```tsx
<ToggleGroup defaultValue={["overview"]}>
  <ToggleGroupItem value="overview">Overview</ToggleGroupItem>
  <ToggleGroupItem value="reports">Reports</ToggleGroupItem>
</ToggleGroup>
{view === "overview" ? <Overview /> : <Reports />}
```

Correct:

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="reports">Reports</TabsTrigger>
  </TabsList>
  <TabsContent value="overview"><Overview /></TabsContent>
  <TabsContent value="reports"><Reports /></TabsContent>
</Tabs>
```

Toggle buttons carry `aria-pressed`, not the `tab` and `tabpanel` roles, so the panel is never associated with its control and arrow-key navigation between views is lost.

### MEDIUM Icon-only items with no accessible name

Wrong:

```tsx
<ToggleGroupItem value="bold"><BoldIcon /></ToggleGroupItem>
```

Correct:

```tsx
<ToggleGroupItem value="bold" aria-label="Toggle bold"><BoldIcon /></ToggleGroupItem>
```

The item's only child is an SVG with no text, so its accessible name is empty and the button is announced as an unlabelled toggle.
