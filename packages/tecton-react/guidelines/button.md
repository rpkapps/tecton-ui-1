---
component: Button
module: "@tecton/react/components/button"
family: actions
exports: [Button, LinkButton, buttonVariants]
notFor:
  - need: a link inside a sentence or a paragraph
    use: Link
  - need: several related actions behind one control
    use: DropdownMenu
  - need: copying a value to the clipboard with feedback
    use: CopyButton
related: [LinkButton, ButtonGroup, Link]
---

## Use it when

- Something happens in place: submit, open a dialog, run an action, trigger a menu.
- A real `button` element is the right semantics, and one of the action weights fits: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`.

## Do

- Handle presses with `onPress` and disable with `isDisabled`; React Aria has no `disabled` contract.
- Pick weight with `variant` and the box with `size`; keep `className` for layout only (`w-full`, `ms-auto`).
- Mark icons with `data-icon="inline-start" | "inline-end"` so the padding adjusts, and give icon-only buttons an `aria-label`.
- Navigate with `LinkButton` from this module, or with `buttonVariants()` on a plain `a`.
- Show work with a `Spinner` child plus `isPending`, which keeps focus and blocks repeat presses (`isDisabled` drops focus); a FAB is the documented `rounded-full shadow-md` recipe.

## Don't

### CRITICAL An anchor nested inside a React Aria Button

Wrong:

```tsx
<Button variant="secondary" size="sm" asChild>
  <a href="/wells/34-10-A-12">Open well</a>
</Button>
```

Correct:

```tsx
<LinkButton variant="secondary" size="sm" href="/wells/34-10-A-12">Open well</LinkButton>
```

React Aria's `Button` has no `asChild`, so the prop is dropped and the anchor is nested inside a `button` that forces `role="button"`: invalid markup, and the link is announced and activated as a button.

### HIGH The disabled prop instead of isDisabled

Wrong:

```tsx
<Button disabled onPress={submit}>Save</Button>
```

Correct:

```tsx
<Button isDisabled onPress={submit}>Save</Button>
```

`disabled` is not part of React Aria's button props, so it never reaches the DOM element and the button stays focusable, hoverable and pressable.

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

### MEDIUM onClick instead of the onPress handler

Wrong:

```tsx
<Button onClick={() => setOpen(true)}>Open</Button>
```

Correct:

```tsx
<Button onPress={() => setOpen(true)}>Open</Button>
```

`onClick` survives only as React Aria's deprecated compatibility alias: it is handed a synthetic mouse event with no `pointerType`, so keyboard and touch activations are indistinguishable from a click.
