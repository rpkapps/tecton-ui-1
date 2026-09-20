---
component: CopyButton
module: "@tecton/react/tecton/copy-button"
family: actions
exports: [CopyButton]
notFor:
  - need: any action on a value other than copying it
    use: Button
  - need: a confirmation that appears away from the control
    use: toast
related: [Button]
---

## Use it when

- A value on screen is meant to be pasted elsewhere: an identifier, a URL, a snippet.
- The user needs the copy confirmed in place, without a toast or a dialog.
- The control sits next to the value, usually as a quiet icon button.

## Do

- Pass the text as `value` and let the component own the press handler.
- Leave it icon-only for a quiet affordance, or pass text `children` for a prominent labelled one.
- Set weight with `variant` (it defaults to `ghost`) and hold time with `timeout`.
- React to a successful copy with `onCopied`, not by wrapping the button in your own handler.
- Let the component name itself: with no children it sets `aria-label` to "Copy", then "Copied".

## Don't

### HIGH A Button with a hand-written clipboard handler

Wrong:

```tsx
<Button variant="ghost" size="icon-sm" onPress={() => navigator.clipboard.writeText(well.id)}>
  <CopyIcon />
</Button>
```

Correct:

```tsx
<CopyButton value={well.id} />
```

The hand-rolled version drops everything the component adds: the copied state and check-mark swap, the `aria-label` that flips to "Copied", and the catch for a denied or insecure clipboard, which otherwise rejects unhandled.

### HIGH An onPress handler passed to CopyButton

Wrong:

```tsx
<CopyButton value={well.id} onPress={() => track("copy")} />
```

Correct:

```tsx
<CopyButton value={well.id} onCopied={() => track("copy")} />
```

`CopyButton` omits `onPress` from its props and spreads the remaining props after its own, so an `onPress` you pass replaces the clipboard handler and the button quietly stops copying.

### HIGH Supplying the icon as the child

Wrong:

```tsx
<CopyButton value={well.id}><CopyIcon /></CopyButton>
```

Correct:

```tsx
<CopyButton value={well.id} />
```

The component already renders `CopyIcon` or `CheckIcon` itself, so a child icon is drawn twice, switches the size default from `icon-sm` to `sm`, and suppresses the automatic accessible name because children are now present.
