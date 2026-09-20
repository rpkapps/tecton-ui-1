---
component: CountBadge
module: "@tecton/react/tecton/count-badge"
family: labels
exports: [CountBadge]
notFor:
  - need: a label with words in it, in the flow of the page
    use: Badge
  - need: a tag the user can select or remove
    use: Chip
  - need: a busy indicator on an icon button
    use: Spinner
related: [Badge, Chip]
---

## Use it when

- A number belongs to an icon button, an avatar or a tab: unread messages, queued jobs, open comments.
- A presence or status dot belongs to an avatar or a tab: `variant="dot"`.
- The number decorates the control; it is not a label the user reads on its own.

## Do

- Wrap the control — `CountBadge` renders the positioned anchor and the badge, and the control stays its child.
- Let the badge hide itself: `count={0}` renders nothing unless `showZero`, and `invisible` hides it while keeping the anchor.
- Pick `color` (`primary`, `error`, `warning`, `success`, `info`, `neutral`, `default`), `anchor` (`top-right` … `bottom-left`) and `max` (counts above it render as `99+`).
- Put the number in the control's accessible name — `aria-label="Messages, 4 unread"` — because the badge is decorative.

## Don't

### HIGH Hiding the control along with the count

Wrong:

```tsx
{unread > 0 && (
  <CountBadge count={unread} color="error">
    <Button variant="outline" size="icon" aria-label="Messages">
      <MailIcon />
    </Button>
  </CountBadge>
)}
```

Correct:

```tsx
<CountBadge count={unread} color="error">
  <Button variant="outline" size="icon" aria-label={`Messages, ${unread} unread`}>
    <MailIcon />
  </Button>
</CountBadge>
```

`CountBadge` is the wrapper, not the badge, so guarding it removes the button from the page as well; the component already hides the badge itself when `count` is 0.

### HIGH Building the count by hand

Wrong:

```tsx
<div className="relative inline-flex">
  <Button variant="outline" size="icon" aria-label="Notifications"><BellIcon /></Button>
  <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1 text-white">{count}</span>
</div>
```

Correct:

```tsx
<CountBadge count={count} color="error">
  <Button variant="outline" size="icon" aria-label="Notifications">
    <BellIcon />
  </Button>
</CountBadge>
```

`red-500` is not a Tecton step, so the reset palette gives the pill no background at all, and the hand-built span has none of the `ring-2 ring-background` cut-out, the `max` cap or the zero handling.

### MEDIUM Putting a count on a dot

Wrong:

```tsx
<CountBadge variant="dot" color="error" count={5}>
  <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
</CountBadge>
```

Correct:

```tsx
<CountBadge color="error" count={5}>
  <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
</CountBadge>
```

The dot variant is an 8 px circle that renders no children by design, so the number is dropped and only the dot appears.
