---
component: Message
module: "@tecton/react/components/message"
family: conversation
exports: [Message, MessageGroup, MessageAvatar, MessageContent, MessageHeader, MessageFooter]
notFor:
  - need: the framed surface the message text is printed on
    use: Bubble
  - need: a row of an application list, with media, title and actions
    use: Item
  - need: the scroll container that follows a growing transcript
    use: MessageScroller
  - need: a status or system line between turns
    use: Marker
related: [Bubble, MessageScroller, Marker]
---

## Use it when

- One turn of a conversation: the avatar, the sender name, the message surface and the actions under it.
- The turn belongs to a side — an assistant or tool row at the start, the user's own row at the end.
- Consecutive turns from the same sender should stack tightly: wrap them in `MessageGroup`.

## Do

- Compose it: `MessageAvatar`, then `MessageContent` holding `MessageHeader`, a `Bubble` and `MessageFooter`.
- Choose the side with `align="start" | "end"`; every part styles itself from the row's `data-align`.
- Put copy, retry and feedback controls in `MessageFooter` as `Button variant="ghost"` with an `aria-label`.
- Wrap each `Message` in a `MessageScrollerItem` so the transcript can anchor, preserve and jump to it.
- Keep `className` for placement: `Message` owns the row direction, the gap and the text size.

## Don't

### HIGH Choosing the message side by hand

Wrong:

```tsx
<Message role="user" className="flex-row-reverse text-right">
  <MessageContent>
    <Bubble>
      <BubbleContent>Re-run the import with the 2024 survey.</BubbleContent>
    </Bubble>
  </MessageContent>
</Message>
```

Correct:

```tsx
<Message align="end">
  <MessageContent>
    <Bubble align="end">
      <BubbleContent>Re-run the import with the 2024 survey.</BubbleContent>
    </Bubble>
  </MessageContent>
</Message>
```

`Message` has no `role` axis, so `role="user"` type-checks and lands on the `div` as an invalid ARIA role, while the reversal, the bubble's `self-end` and the footer's `justify-end` are all `data-[align=end]` rules that the hand-written classes never switch on.

### HIGH A hand-built action row under the message

Wrong:

```tsx
<MessageContent>
  <Bubble variant="muted">
    <BubbleContent>{answer}</BubbleContent>
  </Bubble>
  <div className="mt-2 flex gap-2 text-gray-500">
    <button onClick={copy}>
      <CopyIcon />
    </button>
  </div>
</MessageContent>
```

Correct:

```tsx
<MessageContent>
  <Bubble variant="muted">
    <BubbleContent>{answer}</BubbleContent>
  </Bubble>
  <MessageFooter>
    <Button variant="ghost" size="icon-sm" aria-label="Copy" onPress={copy}>
      <CopyIcon />
    </Button>
  </MessageFooter>
</MessageContent>
```

`MessageAvatar` lifts itself with `group-has-data-[slot=message-footer]/message:-translate-y-8` and only `MessageFooter` follows the row to `justify-end`, so a plain `div` leaves the avatar and the actions misaligned, and `text-gray-500` emits no CSS in the reset palette.
