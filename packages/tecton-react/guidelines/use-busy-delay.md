---
component: useBusyDelay
module: "@tecton/react/tecton/use-busy-delay"
family: hooks
exports: [useBusyDelay]
notFor:
  - need: the spinner itself
    use: Spinner
  - need: a placeholder in the shape of the content that is loading
    use: Skeleton
  - need: progress through a task whose length is known
    use: Progress
related: [Spinner, Skeleton, Button]
---

## Use it when

- A spinner, skeleton or busy label is driven by a pending flag: a transition, a mutation, a fetch.
- Most requests finish quickly and a spinner that appears for a frame would read as a glitch.
- The flag can toggle quickly (retries, refetches) and the busy state must not flicker.

## Do

- Pass the raw flag (`const busy = useBusyDelay(pending)`) and draw the busy indicator (spinner, skeleton, busy label) from the result.
- Disable the control while either flag is set, `disabled={pending || busy}` with `focusableWhenDisabled`: `pending` locks it from the first click, `busy` keeps it locked while the spinner holds.
- Tune the timing with `delay` (200 ms by default) and `minDuration` (300 ms by default) instead of wrapping the hook in your own timers.
- Call it once per independent pending source; each call owns its own timer and cancels it on unmount.

## Don't

### HIGH Hand-rolled timeouts around a pending flag

Wrong:

```tsx
const [showSpinner, setShowSpinner] = React.useState(false)
React.useEffect(() => {
  if (pending) setTimeout(() => setShowSpinner(true), 200)
  else setShowSpinner(false)
}, [pending])
```

Correct:

```tsx
const showSpinner = useBusyDelay(pending)
```

The hand-rolled effect never clears its timer, so a request that ends within 200 ms still turns the spinner on afterwards and leaves it on, and nothing holds the spinner for a minimum time.

### MEDIUM Disabling the control from the delayed flag alone

Wrong:

```tsx
const busy = useBusyDelay(pending)
<Button disabled={busy} onClick={save}>{busy && <Spinner data-icon="inline-start" />}Save</Button>
```

Correct:

```tsx
const busy = useBusyDelay(pending)
<Button disabled={pending || busy} focusableWhenDisabled onClick={save}>{busy && <Spinner data-icon="inline-start" />}Save</Button>
```

The delayed flag is still `false` for the first 200 ms of the request, so the button stays clickable and a second click submits twice.
