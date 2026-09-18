# Date Picker

A date picker component with range and presets.

Source: /docs/components/date-picker.md

**Example — `date-picker-demo`**

```tsx
"use client"

import * as React from "react"
import { getLocalTimeZone, type CalendarDate } from "@internationalized/date"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export function DatePickerDemo() {
  const [date, setDate] = React.useState<CalendarDate | null>(null)

  return (
    <PopoverTrigger>
      <Button
        variant={"outline"}
        data-empty={!date}
        className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
      >
        {date ? (
          date
            .toDate(getLocalTimeZone())
            .toLocaleDateString(undefined, { dateStyle: "long" })
        ) : (
          <span>Pick a date</span>
        )}
        <ChevronDownIcon data-icon="inline-end" />
      </Button>
      <Popover className="w-auto p-0" placement="bottom start">
        <Calendar value={date} onChange={setDate} />
      </Popover>
    </PopoverTrigger>
  )
}
```

## Usage

```tsx showLineNumbers title="components/example-date-picker.tsx"
"use client"

import * as React from "react"
import { getLocalTimeZone, type CalendarDate } from "@internationalized/date"
import { cn } from "cn"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export function DatePickerDemo() {
  const [date, setDate] = React.useState<CalendarDate | null>(null)

  return (
    <PopoverTrigger>
      <Button
        variant="outline"
        data-empty={!date}
        className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
      >
        <CalendarIcon />
        {date ? (
          date
            .toDate(getLocalTimeZone())
            .toLocaleDateString(undefined, { dateStyle: "long" })
        ) : (
          <span>Pick a date</span>
        )}
      </Button>
      <Popover className="w-auto p-0">
        <Calendar value={date} onChange={setDate} />
      </Popover>
    </PopoverTrigger>
  )
}
```

See the [React Aria](https://react-aria.adobe.com/Calendar) documentation for more information.

## Composition

A date picker is built from `Popover` and `Calendar` (there is no `DatePicker` root component):

```text
PopoverTrigger
├── Button
└── Popover
    └── Calendar
```

## Basic

A basic date picker component.

**Example — `date-picker-basic`**

```tsx
"use client"

import * as React from "react"
import { getLocalTimeZone, type CalendarDate } from "@internationalized/date"

import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export function DatePickerSimple() {
  const [date, setDate] = React.useState<CalendarDate | null>(null)

  return (
    <Field className="mx-auto w-44">
      <FieldLabel htmlFor="date-picker-simple">Date</FieldLabel>
      <PopoverTrigger>
        <Button
          variant="outline"
          id="date-picker-simple"
          className="justify-start font-normal"
        >
          {date ? (
            date
              .toDate(getLocalTimeZone())
              .toLocaleDateString(undefined, { dateStyle: "long" })
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
        <Popover className="w-auto p-0" placement="bottom start">
          <Calendar value={date} onChange={setDate} />
        </Popover>
      </PopoverTrigger>
    </Field>
  )
}
```

## Range Picker

A date picker component for selecting a range of dates.

**Example — `date-picker-range`**

```tsx
"use client"

import * as React from "react"
import { CalendarDate, getLocalTimeZone } from "@internationalized/date"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-aria-components"

import { Button } from "@tecton/react/components/button"
import { RangeCalendar } from "@tecton/react/components/calendar"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export function DatePickerWithRange() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    start: new CalendarDate(new Date().getFullYear(), 1, 20),
    end: new CalendarDate(new Date().getFullYear(), 1, 20).add({ days: 20 }),
  })

  return (
    <Field className="mx-auto w-60">
      <FieldLabel htmlFor="date-picker-range">Date Picker Range</FieldLabel>
      <PopoverTrigger>
        <Button
          variant="outline"
          id="date-picker-range"
          className="justify-start px-2.5 font-normal"
        >
          <CalendarIcon data-icon="inline-start" />
          {date?.start && date.end ? (
            new Intl.DateTimeFormat(undefined, {
              dateStyle: "long",
            }).formatRange(
              date.start.toDate(getLocalTimeZone()),
              date.end.toDate(getLocalTimeZone())
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
        <Popover className="w-auto p-0" placement="bottom start">
          <RangeCalendar value={date} onChange={setDate} numberOfMonths={2} />
        </Popover>
      </PopoverTrigger>
    </Field>
  )
}
```

## Date of Birth

A date picker component for selecting a date of birth. This component includes a dropdown caption layout for date and month selection.

**Example — `date-picker-dob`**

```tsx
"use client"

import * as React from "react"
import { getLocalTimeZone, type CalendarDate } from "@internationalized/date"

import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export function DatePickerSimple() {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<CalendarDate | null>(null)

  return (
    <Field className="mx-auto w-44">
      <FieldLabel htmlFor="date">Date of birth</FieldLabel>
      <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
        <Button
          variant="outline"
          id="date"
          className="justify-start font-normal"
        >
          {date
            ? date.toDate(getLocalTimeZone()).toLocaleDateString()
            : "Select date"}
        </Button>
        <Popover
          className="w-auto overflow-hidden p-0"
          placement="bottom start"
        >
          <Calendar
            value={date}
            captionLayout="dropdown"
            onChange={(date) => {
              setDate(date)
              setOpen(false)
            }}
          />
        </Popover>
      </PopoverTrigger>
    </Field>
  )
}
```

## Input

A date picker component with an input field for selecting a date.

**Example — `date-picker-input`**

```tsx
"use client"

import * as React from "react"
import {
  fromDate,
  getLocalTimeZone,
  parseDate,
  toCalendarDate,
  type CalendarDate,
} from "@internationalized/date"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@tecton/react/components/calendar"
import { Field, FieldLabel } from "@tecton/react/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@tecton/react/components/input-group"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

export function DatePickerInput() {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<CalendarDate | undefined>(
    parseDate("2025-06-01")
  )
  const [month, setMonth] = React.useState<CalendarDate>(date!)
  const [value, setValue] = React.useState(
    formatDate(date?.toDate(getLocalTimeZone()))
  )

  return (
    <Field className="mx-auto w-48">
      <FieldLabel htmlFor="date-required">Subscription Date</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="date-required"
          value={value}
          placeholder="June 01, 2025"
          onChange={(e) => {
            const date = new Date(e.target.value)
            setValue(e.target.value)
            if (isValidDate(date)) {
              setDate(toCalendarDate(fromDate(date, getLocalTimeZone())))
              setMonth(toCalendarDate(fromDate(date, getLocalTimeZone())))
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
            <InputGroupButton
              id="date-picker"
              variant="ghost"
              size="icon-xs"
              aria-label="Select date"
            >
              <CalendarIcon />
              <span className="sr-only">Select date</span>
            </InputGroupButton>
            <Popover
              className="w-auto overflow-hidden p-0"
              placement="bottom end"
              crossOffset={-8}
              offset={10}
            >
              <Calendar
                value={date}
                focusedValue={month}
                onFocusChange={setMonth}
                onChange={(date) => {
                  setDate(date)
                  setValue(formatDate(date?.toDate(getLocalTimeZone())))
                  setOpen(false)
                }}
              />
            </Popover>
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
```

## Time Picker

A date picker component with a time input field for selecting a time.

**Example — `date-picker-time`**

```tsx
"use client"

import * as React from "react"
import { getLocalTimeZone, type CalendarDate } from "@internationalized/date"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

export function DatePickerTime() {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<CalendarDate | undefined>(undefined)

  return (
    <FieldGroup className="mx-auto max-w-xs flex-row">
      <Field>
        <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
        <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
          <Button
            variant="outline"
            id="date-picker-optional"
            className="w-32 justify-between font-normal"
          >
            {date
              ? date.toDate(getLocalTimeZone()).toLocaleDateString()
              : "Select date"}
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
          <Popover
            className="w-auto overflow-hidden p-0"
            placement="bottom start"
          >
            <Calendar
              value={date}
              captionLayout="dropdown"
              onChange={(date) => {
                setDate(date)
                setOpen(false)
              }}
            />
          </Popover>
        </PopoverTrigger>
      </Field>
      <Field className="w-32">
        <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
        <Input
          type="time"
          id="time-picker-optional"
          step="1"
          defaultValue="10:30:00"
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `date-picker-rtl`**

```tsx
"use client"

import * as React from "react"
import { getLocalTimeZone, type CalendarDate } from "@internationalized/date"
import { ChevronDownIcon } from "lucide-react"
import { I18nProvider } from "react-aria-components"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      placeholder: "Pick a date",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      placeholder: "اختر تاريخًا",
    },
  },
  he: {
    dir: "rtl",
    values: {
      placeholder: "בחר תאריך",
    },
  },
}

export function DatePickerRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")
  const [date, setDate] = React.useState<CalendarDate | null>(null)

  return (
    <PopoverTrigger>
      <Button
        variant={"outline"}
        data-empty={!date}
        className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
        dir={dir}
      >
        {date ? (
          date
            .toDate(getLocalTimeZone())
            .toLocaleDateString(language, { dateStyle: "long" })
        ) : (
          <span>{t.placeholder}</span>
        )}
        <ChevronDownIcon data-icon="inline-end" />
      </Button>
      <Popover className="w-auto p-0" placement="bottom start" dir={dir}>
        <I18nProvider locale={language}>
          <Calendar value={date} onChange={setDate} />
        </I18nProvider>
      </Popover>
    </PopoverTrigger>
  )
}
```
