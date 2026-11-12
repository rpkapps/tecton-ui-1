---
component: NumberInput
module: "@tecton/react/number-input"
family: forms
exports: [NumberInput]
notFor:
  - need: free text, or digits that are not a quantity (a well name, an identifier, a phone number)
    use: Input
  - need: a one-time code typed one character per box
    use: InputOTP
  - need: a value picked by dragging along a scale
    use: Slider
related: [Field, Input, Slider]
---

## Use it when

- The user types a quantity: a depth, a count, a rate, a percentage, a page number, often with a unit (metres, %, currency) shown in the locale's format.
- The value has bounds or a natural increment the user steps through with − and +, or the arrow keys.

## Do

- Hold a number: `value` / `defaultValue` are `number | null` (`null` while empty) and `onValueChange(value, eventDetails)` reports each change.
- Bound and step it with `min`, `max`, `step` and `largeStep` (Shift); Home and End go to the bounds.
- Show units and decimals with `format` (`Intl.NumberFormatOptions`); the value stays a plain number and the locale is the `TectonProvider`'s.
- Wire it like `Input`: `id` with `FieldLabel htmlFor`, `aria-invalid` with `data-invalid` on the `Field` and the message in `FieldError`; set `allowOutOfRange` when a value past `min` / `max` must be reported rather than clamped.
- Match the form with `variant="outline" | "filled" | "text"` and `size="default" | "sm"`; `className` sets width and placement only.

## Don't

### HIGH An Input with type="number"

Wrong:

```tsx
<Input id="td" type="number" min={0} value={depth} onChange={(e) => setDepth(e.target.value)} />
```

Correct:

```tsx
<NumberInput id="td" min={0} value={depth} onValueChange={setDepth} />
```

The browser draws its own unstyled spin buttons, the value arrives as a string, and a comma decimal typed in a German or French locale is rejected as invalid. (`NumberInput` has no `onChange` either: its text is formatted, so `Number("3,250")` would be `NaN`.)

### HIGH Hand-built − and + buttons in an InputGroup

Wrong:

```tsx
<InputGroup>
  <InputGroupInput id="choke" value={String(choke)} onChange={(e) => setChoke(Number(e.target.value))} />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" onClick={() => setChoke(choke + 2)}>
      <PlusIcon />
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

Correct:

```tsx
<NumberInput id="choke" value={choke} onValueChange={setChoke} min={8} max={128} step={2} />
```

The hand-built buttons have no accessible name, ignore the bounds, sit in the tab order and leave the arrow keys, Shift, Home and End doing nothing.

### MEDIUM A percentage held as the number shown

Wrong:

```tsx
<NumberInput id="porosity" defaultValue={21.5} format={{ style: "percent" }} />
```

Correct:

```tsx
<NumberInput id="porosity" defaultValue={0.215} format={{ style: "percent", maximumFractionDigits: 1 }} />
```

A percent format multiplies by 100, so `21.5` shows as "2,150%", and percent formatting rounds to whole percents unless `maximumFractionDigits` says otherwise.

### MEDIUM A range error that clamping never shows

Wrong:

```tsx
<NumberInput id="wd" max={6000} value={depth} onValueChange={setDepth} aria-invalid={(depth ?? 0) > 6000} />
```

Correct:

```tsx
<NumberInput id="wd" max={6000} allowOutOfRange value={depth} onValueChange={setDepth} aria-invalid={(depth ?? 0) > 6000} />
```

Without `allowOutOfRange` a typed 7200 is clamped to 6000 as it is typed, so the check never fails and the user's number is silently replaced.
