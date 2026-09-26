---
component: Toggle
module: "@tecton/react/components/toggle"
family: actions
exports: [Toggle, toggleVariants]
notFor:
  - need: several related toggles in one segmented control
    use: ToggleGroup
  - need: a control that performs an action rather than holding state
    use: Button
related: [ToggleGroup, Button]
---

## Use it when

- One independent formatting or view option is on or off: bold, bookmark, show labels.
- The control lives in a toolbar or beside content, not in a labelled form row.
- Pressing it changes the surrounding view immediately, with no save step.

## Do

- Hold state with `pressed` / `defaultPressed` and read changes from `onPressedChange`, which receives a boolean.
- Pick `variant="default" | "outline"` and `size="default" | "sm" | "lg"`; they own colour, height and padding.
- Give an icon-only `Toggle` an `aria-label`, and mark a paired icon with `data-icon="inline-start"`.
- Disable with `disabled`.
- Style the pressed look through the variant's `aria-pressed` rules, never with your own colour classes.

## Don't

### CRITICAL React Aria selection props

Wrong:

```tsx
<Toggle aria-label="Toggle bold" isSelected={bold} onChange={setBold}>
  <BoldIcon />
</Toggle>
```

Correct:

```tsx
<Toggle aria-label="Toggle bold" pressed={bold} onPressedChange={setBold}>
  <BoldIcon />
</Toggle>
```

`Toggle` reads `pressed` and reports through `onPressedChange(pressed)`; `isSelected` is not a prop and `onChange` is not a boolean callback, so the button never leaves its initial state.

### HIGH A Toggle used as a labelled form setting

Wrong:

```tsx
<Field orientation="horizontal">
  <Toggle pressed={notify} onPressedChange={setNotify}>Email notifications</Toggle>
</Field>
```

Correct:

```tsx
<Field orientation="horizontal">
  <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
  <FieldLabel htmlFor="notify">Email notifications</FieldLabel>
</Field>
```

`Toggle` renders a button with `aria-pressed`, which announces a pressed control rather than an on/off setting and submits no value with the form.

### MEDIUM An icon-only Toggle with no accessible name

Wrong:

```tsx
<Toggle variant="outline"><BookmarkIcon /></Toggle>
```

Correct:

```tsx
<Toggle variant="outline" aria-label="Toggle bookmark"><BookmarkIcon /></Toggle>
```

The button's only child is an SVG with no text, so its accessible name is empty and it is announced as an unlabelled toggle button.
