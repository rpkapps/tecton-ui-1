---
component: Calendar
module: "@tecton/react/components/calendar"
family: data
exports: [Calendar, CalendarDayButton]
notFor:
  - need: a compact date field that opens a calendar on demand
    use: Popover
  - need: a year or a month picked in a dense form row
    use: NativeSelect
related: [Popover, Field, NativeSelect]
---

## Use it when

- A month grid is the point: choosing a spud date, reading which days are booked, stepping through a schedule.
- The calendar stays on the page — in a `Card`, a panel or a wizard step — rather than hiding behind a trigger.
- A period is chosen as two dates: `mode="range"` draws the span between them.

## Do

- Pick the selection with `mode="single" | "multiple" | "range"` and drive it with `selected` / `onSelect`, holding plain `Date` values (a `DateRange` `{ from, to }` for a range).
- Show more months with `numberOfMonths`, month and year dropdowns with `captionLayout="dropdown"`, week numbers with `showWeekNumber`.
- Block days with `disabled` — a matcher such as `{ before: new Date() }`, `{ dayOfWeek: [0, 6] }` or a function — so they get the dimmed cell styling.
- Resize the grid through its variable, `className="[--cell-size:--spacing(11)]"`; never restyle the cells.
- For a date field, put the `Calendar` in a `PopoverContent` behind a `PopoverTrigger render={<Button variant="outline" />}` inside a `Field`; there is no `DatePicker` component.

## Don't

### CRITICAL React Aria calendar props

Wrong:

```tsx
<Calendar
  value={today(getLocalTimeZone())}
  onChange={setDate}
  minValue={today(getLocalTimeZone())}
/>
```

Correct:

```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  disabled={{ before: new Date() }}
/>
```

`Calendar` is react-day-picker: `value`, `onChange` and `minValue` are not its props and `@internationalized/date` values mean nothing to it, so the grid renders with nothing selected, every day pickable and no callback firing.

### HIGH Two Calendars for a start and an end

Wrong:

```tsx
<div className="flex gap-4">
  <Calendar mode="single" selected={start} onSelect={setStart} />
  <Calendar mode="single" selected={end} onSelect={setEnd} />
</div>
```

Correct:

```tsx
<Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />
```

Only `mode="range"` draws the start, middle and end cell states and keeps the end on or after the start; two single calendars let the user pick an end before the start.

### MEDIUM Resizing the day cells with className

Wrong:

```tsx
<Calendar mode="single" selected={date} onSelect={setDate} className="[&_button]:size-11" />
```

Correct:

```tsx
<Calendar mode="single" selected={date} onSelect={setDate} className="[--cell-size:--spacing(11)]" />
```

The grid, the navigation buttons and the dropdowns all read `--cell-size`, so resizing only the buttons leaves the header and weekday row at the old width and misaligns the columns.
