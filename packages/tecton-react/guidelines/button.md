---
component: Button
module: "@tecton/react/components/button"
family: actions
exports: [Button, buttonVariants]
notFor:
  - need: a link inside a sentence or a paragraph
    use: Link
  - need: several related actions behind one control
    use: DropdownMenu
  - need: copying a value to the clipboard with feedback
    use: CopyButton
related: [ButtonGroup, Link]
---

## Use it when

- Something happens in place: submit, open a dialog, run an action, trigger a menu.
- A real `button` element is the right semantics, and one of the action weights fits: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`.

## Do

- Handle presses with `onClick` and disable with `disabled`; add `focusableWhenDisabled` when a disabled button must stay in the tab order (a pending submit).
- Pick weight with `variant` and the box with `size`; keep `className` for layout only (`w-full`, `ms-auto`).
- Mark icons with `data-icon="inline-start" | "inline-end"` so the padding adjusts, and give icon-only buttons an `aria-label`.
- Navigate with `render={<a href="…" />}` plus `nativeButton={false}`, or with `buttonVariants()` on a plain `a`.
- A trigger (`DialogTrigger`, `PopoverTrigger`, `DropdownMenuTrigger`) takes the button as `render={<Button variant="outline" />}`; never nest a `Button` inside a trigger.

## Don't

### CRITICAL An anchor nested inside a Button

Wrong:

```tsx
<Button variant="secondary" size="sm" asChild>
  <a href="/wells/34-10-A-12">Open well</a>
</Button>
```

Correct:

```tsx
<Button variant="secondary" size="sm" nativeButton={false} render={<a href="/wells/34-10-A-12" />}>
  Open well
</Button>
```

There is no `asChild`, so the prop is dropped and the anchor is nested inside a `button`: invalid markup, and the link is announced and activated as a button.

### HIGH React Aria props on a Button

Wrong:

```tsx
<Button isDisabled onPress={submit}>Save</Button>
```

Correct:

```tsx
<Button disabled onClick={submit}>Save</Button>
```

`isDisabled` and `onPress` are not props of this button: they are spread onto the DOM element as unknown attributes, so the button stays enabled and pressing it does nothing.

### HIGH Sizing and colouring a Button with className

Wrong:

```tsx
<Button className="h-12 bg-blue-600 px-6 text-white">Assign</Button>
```

Correct:

```tsx
<Button size="lg">Assign</Button>
```

The variant owns colour, shape, size and padding, and Tailwind's stock palette is reset here, so `bg-blue-600` emits no CSS while the hand-set height breaks the `size` scale.

### MEDIUM A Button nested inside a trigger

Wrong:

```tsx
<DialogTrigger>
  <Button variant="outline">Edit well</Button>
</DialogTrigger>
```

Correct:

```tsx
<DialogTrigger render={<Button variant="outline" />}>Edit well</DialogTrigger>
```

The trigger already renders a `button`, so a nested `Button` produces a button inside a button: invalid markup with two tab stops for one control.
