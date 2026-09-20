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

- Give every `AccordionItem` an `id`: that string is the key in `defaultExpandedKeys`, `expandedKeys` and the `Set` passed to `onExpandedChange`.
- Allow several sections at once with `allowsMultipleExpanded` (the default is one), and disable one with `isDisabled` on its `AccordionItem`, which disables its trigger too.
- Put the heading text straight into `AccordionTrigger`: it renders the React Aria `Heading`, the button and the chevron pair itself, so `className` on `Accordion` is for width and frame only (`max-w-lg`, `border`).

## Don't

### CRITICAL Radix accordion props instead of React Aria keys

Wrong:

```tsx
<Accordion type="single" collapsible defaultValue="shipping">
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping options</AccordionTrigger>
    <AccordionContent>Standard, express and overnight.</AccordionContent>
  </AccordionItem>
</Accordion>
```

Correct:

```tsx
<Accordion defaultExpandedKeys={["shipping"]}>
  <AccordionItem id="shipping">
    <AccordionTrigger>Shipping options</AccordionTrigger>
    <AccordionContent>Standard, express and overnight.</AccordionContent>
  </AccordionItem>
</Accordion>
```

`Accordion` is a React Aria `DisclosureGroup`, which passes its props through `filterDOMProps`: `type`, `collapsible`, `defaultValue` and `value` are dropped before they reach the DOM or the state, and an item with no `id` falls back to a generated `useId` key, so nothing opens and no key you write ever matches.

### HIGH Tracking the open section with onClick on the trigger

Wrong:

```tsx
<Accordion>
  <AccordionItem id="privacy">
    <AccordionTrigger onClick={() => setSection("privacy")}>Privacy</AccordionTrigger>
    <AccordionContent>Two-factor authentication and active sessions.</AccordionContent>
  </AccordionItem>
</Accordion>
```

Correct:

```tsx
<Accordion expandedKeys={sections} onExpandedChange={setSections}>
  <AccordionItem id="privacy">
    <AccordionTrigger>Privacy</AccordionTrigger>
    <AccordionContent>Two-factor authentication and active sessions.</AccordionContent>
  </AccordionItem>
</Accordion>
```

`onClick` is only React Aria's press alias on the trigger button, so it fires on the collapse as well as the expand and never sees the group closing a different section under `allowsMultipleExpanded={false}`; `onExpandedChange` reports the whole key set.

### MEDIUM A chevron added to the trigger

Wrong:

```tsx
<AccordionTrigger>
  Billing
  <ChevronDownIcon className="ml-auto size-4" />
</AccordionTrigger>
```

Correct:

```tsx
<AccordionTrigger>Billing</AccordionTrigger>
```

`AccordionTrigger` already appends a `ChevronDownIcon`/`ChevronUpIcon` pair tagged `data-slot="accordion-trigger-icon"`, which is what the `ml-auto`, `size-5` and `group-aria-expanded` swap rules target, so a hand-added icon becomes a second, static chevron in the middle of the row.
