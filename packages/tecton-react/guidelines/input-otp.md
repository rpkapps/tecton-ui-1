---
component: InputOTP
module: "@tecton/react/components/input-otp"
family: forms
exports: [InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator]
notFor:
  - need: a password, a token or any other free-form value
    use: Input
  - need: a field with an icon or a button attached
    use: InputGroup
  - need: the label, description and error message around the code
    use: Field
related: [Input, Field]
---

## Use it when

- A one-time code from email, SMS or an authenticator app.
- A short fixed-length PIN the user reads from somewhere and types once.
- The value has a known length and every character deserves its own box.

## Do

- Set `maxLength` to the number of `InputOTPSlot` children, and give each slot its absolute `index` across every group.
- Control it with `value` and `onChange(value: string)`, or leave it uncontrolled with `defaultValue`.
- Restrict the alphabet with `pattern={REGEXP_ONLY_DIGITS}` or `REGEXP_ONLY_DIGITS_AND_CHARS` from `input-otp`.
- Split long codes with `InputOTPGroup` and `InputOTPSeparator`, and mark errors with `aria-invalid` on each `InputOTPSlot`.
- Wrap it in a `Field` with a `FieldLabel htmlFor` pointing at the `InputOTP` id, and disable with `disabled`.

## Don't

### HIGH Restarting the slot index in each group

Wrong:

```tsx
<InputOTP maxLength={4}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
  </InputOTPGroup>
</InputOTP>
```

Correct:

```tsx
<InputOTP maxLength={4}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
</InputOTP>
```

`index` addresses the shared `OTPInputContext` slot array, so repeated indices echo the first characters twice and the rest of the code is never displayed.

### MEDIUM Marking the group invalid instead of the slots

Wrong:

```tsx
<InputOTPGroup aria-invalid>
  <InputOTPSlot index={0} />
  <InputOTPSlot index={1} />
</InputOTPGroup>
```

Correct:

```tsx
<InputOTPGroup>
  <InputOTPSlot index={0} aria-invalid />
  <InputOTPSlot index={1} aria-invalid />
</InputOTPGroup>
```

`InputOTPGroup` paints its error state with `has-aria-invalid:`, which looks for a descendant, so `aria-invalid` on the group itself styles nothing.
