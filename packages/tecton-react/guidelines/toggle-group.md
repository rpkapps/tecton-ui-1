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
- Several of those options may be on at the same time (`selectionMode="multiple"`).
- The options are icons or one-word labels that fit in a segmented row.

## Do

- Key each item with `id`; read `selectedKeys` / `defaultSelectedKeys` and `onSelectionChange`, which hands you a `Set`.
- Choose `selectionMode="single"` for an exclusive choice, `"multiple"` for independent toggles.
- Shape the bar with `variant="outline"`, `size` and `spacing={0}`; the joined corners and shared borders come from the variant.
- Give every icon-only `ToggleGroupItem` an `aria-label`, and stack with `orientation="vertical"`.

## Don't

### CRITICAL Radix value props instead of selectedKeys and id

Wrong:

```tsx
<ToggleGroup type="single" value={weight} onValueChange={setWeight}>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
</ToggleGroup>
```

Correct:

```tsx
<ToggleGroup
  selectionMode="single"
  selectedKeys={[weight]}
  onSelectionChange={(keys) => setWeight([...keys][0] as string)}
>
  <ToggleGroupItem id="bold">Bold</ToggleGroupItem>
</ToggleGroup>
```

React Aria keys toggle items by `id` and reports a `Set` through `onSelectionChange`; `type`, `value` and `onValueChange` are not props here, so the group renders but never records a selection.

### HIGH A toggle group used to switch content panels

Wrong:

```tsx
<ToggleGroup selectionMode="single" defaultSelectedKeys={["overview"]}>
  <ToggleGroupItem id="overview">Overview</ToggleGroupItem>
  <ToggleGroupItem id="reports">Reports</ToggleGroupItem>
</ToggleGroup>
{view === "overview" ? <Overview /> : <Reports />}
```

Correct:

```tsx
<Tabs defaultSelectedKey="overview">
  <TabsList>
    <TabsTrigger id="overview">Overview</TabsTrigger>
    <TabsTrigger id="reports">Reports</TabsTrigger>
  </TabsList>
  <TabsContent id="overview"><Overview /></TabsContent>
  <TabsContent id="reports"><Reports /></TabsContent>
</Tabs>
```

Toggle buttons carry `aria-pressed`, not the `tab` and `tabpanel` roles, so the panel is never associated with its control and arrow-key navigation between views is lost.

### MEDIUM Icon-only items with no accessible name

Wrong:

```tsx
<ToggleGroupItem id="bold"><BoldIcon /></ToggleGroupItem>
```

Correct:

```tsx
<ToggleGroupItem id="bold" aria-label="Toggle bold"><BoldIcon /></ToggleGroupItem>
```

The item's only child is an SVG with no text, so its accessible name is empty and the button is announced as an unlabelled toggle.
