---
component: Accordion
module: "@tecton/react/components/accordion"
family: layout
exports: [Accordion, AccordionItem, AccordionTrigger, AccordionContent]
notFor:
  - need: one region that opens and closes on its own
    use: Collapsible
  - need: sections that replace each other in the same space
    use: Tabs
  - need: an expandable hierarchy of folders and records
    use: TreeView
related: [Collapsible, Tabs, TreeView]
---

## Use it when

- Several independent sections stack vertically and the reader opens the ones they need: an FAQ, grouped settings, a long form in parts.
- Every section stays on the page; opening one does not replace another.
- The set is small and known, so rendering every panel up front costs nothing.

## Do

- Give every `AccordionItem` a `value`: that string is what `defaultValue`, `value` and `onValueChange` hold — always an **array**, even when one section opens at a time.
- Allow several sections at once with `multiple` (the default is one), and disable one with `disabled` on its `AccordionItem`.
- Put the heading text straight into `AccordionTrigger`: it renders the heading, the button and the chevron pair itself, so `className` on `Accordion` is for width and frame only (`max-w-lg`, `border`).

## Don't

### CRITICAL type, collapsible and defaultExpandedKeys on the accordion

Wrong:

```tsx
<Accordion type="single" collapsible defaultExpandedKeys={["casing"]}>
  <AccordionItem id="casing">
    <AccordionTrigger>Casing program</AccordionTrigger>
    <AccordionContent>Conductor, surface and production strings.</AccordionContent>
  </AccordionItem>
</Accordion>
```

Correct:

```tsx
<Accordion defaultValue={["casing"]}>
  <AccordionItem value="casing">
    <AccordionTrigger>Casing program</AccordionTrigger>
    <AccordionContent>Conductor, surface and production strings.</AccordionContent>
  </AccordionItem>
</Accordion>
```

`type`, `collapsible`, `defaultExpandedKeys` and `id` are not accordion props, and an item with no `value` gets a generated one, so no value you write ever matches and the section starts closed.

### HIGH Tracking the open section with onClick on the trigger

Wrong:

```tsx
<Accordion>
  <AccordionItem value="privacy">
    <AccordionTrigger onClick={() => setSection("privacy")}>Privacy</AccordionTrigger>
    <AccordionContent>Two-factor authentication and active sessions.</AccordionContent>
  </AccordionItem>
</Accordion>
```

Correct:

```tsx
<Accordion value={sections} onValueChange={setSections}>
  <AccordionItem value="privacy">
    <AccordionTrigger>Privacy</AccordionTrigger>
    <AccordionContent>Two-factor authentication and active sessions.</AccordionContent>
  </AccordionItem>
</Accordion>
```

`onClick` fires on the collapse as well as the expand and never sees the group closing another section when a new one opens; `onValueChange` reports the whole array of open values.

### MEDIUM A chevron added to the trigger

Wrong:

```tsx
<AccordionTrigger>
  Billing
  <ChevronDownIcon className="ms-auto size-4" />
</AccordionTrigger>
```

Correct:

```tsx
<AccordionTrigger>Billing</AccordionTrigger>
```

`AccordionTrigger` already appends a `ChevronDownIcon`/`ChevronUpIcon` pair tagged `data-slot="accordion-trigger-icon"`, which the `ms-auto`, `size-5` and `aria-expanded` swap rules target, so a hand-added icon becomes a second, static chevron in the middle of the row.
