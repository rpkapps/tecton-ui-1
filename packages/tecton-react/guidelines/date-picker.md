---
component: DatePicker
module: "@tecton/react/tecton/date-picker"
family: forms
exports: [DatePicker, DateRangePicker, datePickerVariants]
docs: components/date-picker
notFor:
  - need: a month grid that stays on the page
    use: Calendar
  - need: a year or a month picked in a dense form row
    use: NativeSelect
related: [Field, Calendar, Popover]
---

## Use it when

- A form field holds one date — a spud date, a report date, a date of birth — picked on a calendar that opens from a button.
- The user may know the date and want to type it: `variant="input"`, a date input with a calendar button.
- A period is picked as a start and an end: `DateRangePicker`, two months side by side, with `presets` such as `"last7Days"` and `"thisMonth"`.

## Do

- Put it in a `Field` with an `id` and a `FieldLabel htmlFor`: the label names the trigger and the date describes it.
- Hold plain `Date` values in `value` / `defaultValue` / `onValueChange` (a `{ from, to }` range for `DateRangePicker`); `onValueChange` reports `undefined` when the date is cleared.
- Bound the days with `minDate` / `maxDate`, and pass `captionLayout="dropdown"` when the date is years away (a date of birth).
- Let the `TectonProvider` set the locale: the text, the calendar's month and day names and its first weekday all follow it; change how the date is written with `format` (`Intl.DateTimeFormat` options), never by formatting it yourself.
- Give `className` the width only (`w-full` in a `Field`, `w-48`).

## Don't

### HIGH Assembling Popover, Button and Calendar for a date field

Wrong:

```tsx
<Popover>
  <PopoverTrigger render={<Button variant="outline" />}>
    {date ? format(date, "PPP") : "Pick a date"}
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>
```

Correct:

```tsx
<Field>
  <FieldLabel htmlFor="spud-date">Spud date</FieldLabel>
  <DatePicker id="spud-date" value={date} onValueChange={setDate} />
</Field>
```

The hand-built picker writes the date in English whatever the locale, shows the calendar in English, does not close or give focus back when a day is picked, and differs from every other team's copy; `DatePicker` does all of it the same way everywhere.

### HIGH An Input type="date" next to a calendar button

Wrong:

```tsx
<InputGroup>
  <InputGroupInput type="date" value={text} onChange={(e) => setText(e.target.value)} />
  <InputGroupAddon align="inline-end">…</InputGroupAddon>
</InputGroup>
```

Correct:

```tsx
<DatePicker id="report-date" variant="input" value={date} onValueChange={setDate} />
```

The `input` variant parses what the user types in the provider's locale ("1. Juni 2025", "6/1/2025", "2025-06-01"), opens the calendar on Alt+↓ and writes the date back out on blur; a native date input looks different in every browser and ignores the provider's locale.

### MEDIUM Two DatePickers for a start and an end

Wrong:

```tsx
<DatePicker value={start} onValueChange={setStart} />
<DatePicker value={end} onValueChange={setEnd} />
```

Correct:

```tsx
<DateRangePicker value={range} onValueChange={setRange} presets={["last7Days", "last30Days"]} />
```

Two pickers let the end come before the start and show neither the span between them; `DateRangePicker` orders the two days it is given and draws the range across both months.
