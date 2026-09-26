---
component: Bubble
module: "@tecton/react/components/bubble"
family: conversation
exports: [Bubble, BubbleGroup, BubbleContent, BubbleReactions]
notFor:
  - need: the whole turn, with avatar, sender name and message actions
    use: Message
  - need: a row of an application list, with media, title and actions
    use: Item
  - need: a file or an image card inside a message or a composer
    use: Attachment
related: [Message, Attachment, Marker]
---

## Use it when

- The framed surface one message is printed on: chat text, a quoted reply, a short structured answer.
- Assistant prose or rich content must span the row: `variant="ghost"` drops the frame and the 80% cap.
- The surface itself is pressable: a suggestion, a quick reply, a failed action that opens its error.

## Do

- Always put the text inside `BubbleContent`; every variant styles `*:data-[slot=bubble-content]`, not the root.
- Pick the role with `variant="default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive"`.
- Set the side with `align="end"` on the `Bubble`, or let the surrounding `Message align="end"` do it.
- Anchor emoji or quick actions with `BubbleReactions side="top" | "bottom"`; give a static row `role="img"` and an `aria-label`.
- Keep `className` for width and inner layout; the padding, radius and fill belong to the variant.

## Don't

### CRITICAL Assistant text dropped straight into Bubble

Wrong:

```tsx
<Bubble variant="ghost">{answer}</Bubble>
```

Correct:

```tsx
<Bubble variant="ghost">
  <BubbleContent className="flex flex-col gap-2">{answer}</BubbleContent>
</Bubble>
```

Every variant is a `*:data-[slot=bubble-content]` rule and the padding, radius and `text-sm leading-relaxed` live on `BubbleContent`, so a bare child renders as unpadded, unframed text with no bubble around it at all.

### HIGH Painting the user bubble with className

Wrong:

```tsx
<Bubble className="ml-auto bg-blue-600 text-white">
  <BubbleContent>{text}</BubbleContent>
</Bubble>
```

Correct:

```tsx
<Bubble variant="default" align="end">
  <BubbleContent>{text}</BubbleContent>
</Bubble>
```

`bg-blue-600` is stock Tailwind, which this palette resets to nothing, and a fill on the root would miss the `bubble-content` child that carries it anyway, while `self-end` comes from `data-[align=end]`, not from a margin.

### HIGH A clickable bubble built with onClick

Wrong:

```tsx
<Bubble variant="muted">
  <BubbleContent onClick={() => reply(suggestion)}>{suggestion}</BubbleContent>
</Bubble>
```

Correct:

```tsx
<Bubble variant="muted">
  <BubbleContent render={<button type="button" onClick={() => reply(suggestion)} />}>
    {suggestion}
  </BubbleContent>
</Bubble>
```

Without `render` the content stays a `div`, so the handler answers a mouse only — no tab stop, no Enter, no role — and the hover and `focus-visible:ring-2` treatments are `[button,a]:` selectors that never match it.
