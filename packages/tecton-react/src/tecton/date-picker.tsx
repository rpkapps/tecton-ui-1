"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
import type { Matcher } from "react-day-picker"

import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@tecton/react/components/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import { Spinner } from "@tecton/react/components/spinner"
import { useLocale } from "@tecton/react/tecton/provider"

import { useCalendarLocale } from "./internal/calendar-locale"
import {
  dateFormatter,
  isSameDay,
  isWithin,
  parseDate,
  startOfDay,
  toISODate,
} from "./internal/date-text"
import { useTranslations } from "./internal/i18n/translations"
import { useEventCallback } from "./internal/primitives/use-controlled"

/**
 * Tecton DatePicker and DateRangePicker — a `Popover` with a `Calendar`,
 * opened from a button that shows the date (or from the calendar button of
 * a date input, `variant="input"`). The date is formatted with
 * `Intl.DateTimeFormat` in the `TectonProvider`'s locale, the calendar's
 * month and day names come in the same locale, and both follow its
 * direction. A day picked closes the popover and focus goes back to what
 * opened it; Escape does the same without a change.
 */

/** A range of days; `to` is absent while only the start is known. */
type DateRange = { from?: Date; to?: Date }

const datePickerVariants = cva("font-normal", {
  variants: {
    variant: {
      button:
        "w-[212px] justify-between text-start data-[empty=true]:text-muted-foreground",
      input: "w-48",
    },
  },
  defaultVariants: {
    variant: "button",
  },
})

/** Attributes passed on to the control: the trigger button, or the input. */
type ControlProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "defaultValue" | "onChange" | "children" | "placeholder" | "dir" | "color"
>

type CommonProps = {
  /** Controls whether the calendar is open. */
  open?: boolean
  /** Whether the calendar is open at first, uncontrolled. Default `false`. */
  defaultOpen?: boolean
  /** Called when the calendar opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Shown while there is no date. Default "Pick a date" (translated). */
  placeholder?: string
  disabled?: boolean
  /** The earliest day that can be picked; the calendar starts at its month. */
  minDate?: Date
  /** The latest day that can be picked; the calendar ends at its month. */
  maxDate?: Date
  /**
   * How the date is written, as `Intl.DateTimeFormat` options (the locale
   * is the provider's). Default `{ dateStyle: "long" }`; for a range,
   * `{ month: "short", day: "numeric", year: "numeric" }`.
   */
  format?: Intl.DateTimeFormatOptions
}

type DatePickerProps = ControlProps &
  CommonProps &
  VariantProps<typeof datePickerVariants> & {
    /** The picked day, controlled: `undefined` is no date. */
    value?: Date | undefined
    /** The day picked at first, uncontrolled. */
    defaultValue?: Date | undefined
    /** Called with the day picked, typed, or `undefined` when cleared. */
    onValueChange?: (value: Date | undefined) => void
    /**
     * `"dropdown"` puts month and year dropdowns in the calendar's caption,
     * for days years away (a date of birth). Default `"label"`.
     */
    captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
    /** Submits the day as `YYYY-MM-DD` with a form, under this name. */
    name?: string
  }

/** A preset the range picker knows by name; its label is translated. */
type DateRangePresetName =
  "today" | "yesterday" | "last7Days" | "last30Days" | "thisMonth" | "lastMonth"

/** A preset of your own. */
type DateRangePreset = { label: string; value: DateRange }

type DateRangePickerProps = ControlProps &
  CommonProps & {
    /** The picked range, controlled: `undefined` is no range. */
    value?: DateRange | undefined
    /** The range picked at first, uncontrolled. */
    defaultValue?: DateRange | undefined
    /** Called with the range once both ends are picked, or a preset is. */
    onValueChange?: (value: DateRange | undefined) => void
    /** Months shown side by side (stacked on narrow screens). Default 2. */
    numberOfMonths?: number
    /** Buttons under the calendar that pick a range at once. */
    presets?: ReadonlyArray<DateRangePresetName | DateRangePreset>
  }

/**
 * A prop that is controlled when the owner passes it (even as `undefined`,
 * which is a value here: no date) and kept here otherwise.
 */
function useControllableState<T>(
  controlled: boolean,
  value: T,
  defaultValue: T,
  onChange: ((value: T) => void) | undefined
): [T, (value: T) => void] {
  const [own, setOwn] = React.useState(defaultValue)
  const set = useEventCallback((next: T) => {
    if (!controlled) setOwn(next)
    onChange?.(next)
  })
  return [controlled ? value : own, set]
}

/** A formatter in the provider's locale, the same while its options are. */
function useFormatter(
  format: Intl.DateTimeFormatOptions | undefined,
  fallback: Intl.DateTimeFormatOptions
) {
  const { locale } = useLocale()
  const key = JSON.stringify(format ?? fallback)
  return React.useMemo(
    () => dateFormatter(locale, JSON.parse(key) as Intl.DateTimeFormatOptions),
    [locale, key]
  )
}

/**
 * Whether a control has a name of its own (a `<label>`, `aria-label` or
 * `aria-labelledby`): its text, the date, is then its description, or a
 * screen reader would read the label without the date.
 */
function useHasLabel(ref: React.RefObject<HTMLButtonElement | null>) {
  const [labelled, setLabelled] = React.useState(false)
  React.useLayoutEffect(() => {
    const element = ref.current
    const next =
      !!element &&
      (element.labels.length > 0 ||
        element.hasAttribute("aria-label") ||
        element.hasAttribute("aria-labelledby"))
    if (next !== labelled) setLabelled(next)
  })
  return labelled
}

/** The calendar's limits from `minDate` and `maxDate`. */
function calendarBounds(minDate?: Date, maxDate?: Date) {
  const disabled: Array<Matcher> = []
  if (minDate) disabled.push({ before: startOfDay(minDate) })
  if (maxDate) disabled.push({ after: startOfDay(maxDate) })
  return {
    disabled: disabled.length ? disabled : undefined,
    startMonth: minDate,
    endMonth: maxDate,
  }
}

/** The month to open on: the day's, else today's when it is in range, else the nearest bound's. */
function openingMonth(day: Date | undefined, minDate?: Date, maxDate?: Date) {
  if (day) return day
  const today = new Date()
  if (minDate && !isWithin(today, minDate)) return minDate
  if (maxDate && !isWithin(today, undefined, maxDate)) return maxDate
  return undefined
}

/**
 * Whether the calendar opened from the keyboard: it then focuses its day,
 * so the arrows work at once. Opened with a pointer, the popover takes
 * focus itself and no day shows a focus ring.
 */
const DayFocusContext = React.createContext(false)

/** Tracks whether the next open comes from a key or from a pointer. */
function useOpenedWithKeyboard() {
  const [keyboard, setKeyboard] = React.useState(false)
  return {
    keyboard,
    setKeyboard,
    triggerProps: {
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") setKeyboard(true)
      },
      onPointerDown: () => setKeyboard(false),
    },
  }
}

/** Shown in place of the calendar while its locale loads. */
function CalendarLoading() {
  return (
    <div
      data-slot="date-picker-loading"
      className="flex h-72 w-62 items-center justify-center"
    >
      <Spinner className="text-muted-foreground" />
    </div>
  )
}

/** The calendar of a single date, in the provider's locale and direction. */
function SingleCalendar({
  value,
  onPick,
  minDate,
  maxDate,
  captionLayout,
}: {
  value: Date | undefined
  onPick: (day: Date) => void
  minDate?: Date
  maxDate?: Date
  captionLayout: DatePickerProps["captionLayout"]
}) {
  const { locale, direction } = useLocale()
  const calendarLocale = useCalendarLocale(locale)
  const focusDay = React.useContext(DayFocusContext)
  if (calendarLocale === null) return <CalendarLoading />
  return (
    <Calendar
      mode="single"
      selected={value}
      // The day picked again stays picked.
      onSelect={(_, day) => onPick(day)}
      defaultMonth={openingMonth(value, minDate, maxDate)}
      captionLayout={captionLayout}
      locale={calendarLocale}
      dir={direction}
      autoFocus={focusDay}
      {...calendarBounds(minDate, maxDate)}
    />
  )
}

/**
 * Tecton DatePicker — one day, picked on a calendar in a popover.
 * `variant="input"` is a date input with a calendar button instead: type
 * the date in the locale's own way ("June 1, 2025", "6/1/2025",
 * "2025-06-01"), or press Alt+↓ (or ↓) to open the calendar.
 */
function DatePicker(props: DatePickerProps) {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    placeholder,
    disabled,
    minDate,
    maxDate,
    format,
    captionLayout,
    name,
    variant = "button",
    className,
    ...controlProps
  } = props
  const t = useTranslations("datePicker")
  const { locale } = useLocale()
  // Starts loading the calendar's locale now, not when it opens.
  useCalendarLocale(locale)
  const [value, setValue] = useControllableState(
    "value" in props,
    valueProp,
    defaultValue,
    onValueChange
  )
  const [open, setOpen] = useControllableState(
    openProp !== undefined,
    openProp ?? false,
    defaultOpen,
    onOpenChange
  )
  const formatter = useFormatter(format, { dateStyle: "long" })
  const hidden = name ? (
    <input type="hidden" name={name} value={value ? toISODate(value) : ""} />
  ) : null

  if (variant === "input") {
    return (
      <>
        <DateInput
          {...controlProps}
          className={className}
          value={value}
          onValueChange={setValue}
          open={open}
          onOpenChange={setOpen}
          placeholder={placeholder ?? t("placeholder")}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          formatter={formatter}
          captionLayout={captionLayout}
        />
        {hidden}
      </>
    )
  }

  return (
    <>
      <DateButton
        {...controlProps}
        slot="date-picker"
        className={cn(datePickerVariants({ variant }), className)}
        text={value ? formatter.format(value) : undefined}
        placeholder={placeholder ?? t("placeholder")}
        icon={<ChevronDownIcon data-icon="inline-end" />}
        iconPosition="end"
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        popupLabel={t("chooseDate")}
      >
        <SingleCalendar
          value={value}
          onPick={(day) => {
            setValue(day)
            setOpen(false)
          }}
          minDate={minDate}
          maxDate={maxDate}
          captionLayout={captionLayout}
        />
      </DateButton>
      {hidden}
    </>
  )
}

/** The trigger button and its popover, shared by both pickers. */
function DateButton({
  slot,
  className,
  text,
  placeholder,
  icon,
  iconPosition,
  open,
  onOpenChange,
  disabled,
  popupLabel,
  children,
  "aria-describedby": describedBy,
  ...controlProps
}: ControlProps & {
  slot: string
  text: string | undefined
  placeholder: string
  icon: React.ReactElement
  iconPosition: "start" | "end"
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled: boolean | undefined
  popupLabel: string
  children: React.ReactNode
}) {
  const valueId = React.useId()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const labelled = useHasLabel(triggerRef)
  const { keyboard, triggerProps } = useOpenedWithKeyboard()
  return (
    <Popover open={open} onOpenChange={(next) => onOpenChange(next)}>
      <PopoverTrigger
        ref={triggerRef}
        disabled={disabled}
        {...triggerProps}
        render={
          <Button
            {...controlProps}
            variant="outline"
            data-slot={slot}
            data-empty={!text}
            aria-describedby={
              [labelled ? valueId : null, describedBy]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={className}
          />
        }
      >
        {iconPosition === "start" ? icon : null}
        <span id={valueId} className="truncate">
          {text ?? placeholder}
        </span>
        {iconPosition === "end" ? icon : null}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto gap-0 overflow-hidden p-0"
        align="start"
        aria-label={popupLabel}
        // From the keyboard, the calendar focuses its day itself.
        initialFocus={keyboard ? false : undefined}
      >
        <DayFocusContext value={keyboard}>{children}</DayFocusContext>
      </PopoverContent>
    </Popover>
  )
}

/** The input variant: a text field for the date and a calendar button. */
function DateInput({
  className,
  value,
  onValueChange,
  open,
  onOpenChange,
  placeholder,
  disabled,
  minDate,
  maxDate,
  formatter,
  captionLayout,
  onKeyDown,
  onBlur,
  "aria-invalid": ariaInvalid,
  ...controlProps
}: ControlProps & {
  value: Date | undefined
  onValueChange: (value: Date | undefined) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder: string
  disabled: boolean | undefined
  minDate?: Date
  maxDate?: Date
  formatter: Intl.DateTimeFormat
  captionLayout: DatePickerProps["captionLayout"]
}) {
  const t = useTranslations("datePicker")
  const { locale } = useLocale()
  const inputRef = React.useRef<HTMLInputElement>(null)
  // Opened with the keyboard from the input: focus goes back there.
  const fromInput = React.useRef(false)
  const { keyboard, setKeyboard, triggerProps } = useOpenedWithKeyboard()
  const write = React.useCallback(
    (date: Date | undefined) => (date ? formatter.format(date) : ""),
    [formatter]
  )
  const [text, setText] = React.useState(() => write(value))
  const [invalid, setInvalid] = React.useState(false)

  // A new value from outside (or a new format) rewrites the text; one that
  // came from what is being typed leaves it as typed.
  const valueKey = value ? toISODate(value) : ""
  const [shown, setShown] = React.useState({ valueKey, formatter })
  if (shown.valueKey !== valueKey || shown.formatter !== formatter) {
    setShown({ valueKey, formatter })
    const typed = text.trim() ? parseDate(text, locale) : undefined
    const fromTyping =
      shown.formatter === formatter &&
      (value ? !!typed && isSameDay(typed, value) : typed === undefined)
    if (!fromTyping) {
      setText(write(value))
      setInvalid(false)
    }
  }

  const accept = (date: Date | undefined) => {
    setInvalid(false)
    if (!isSameDay(date, value)) onValueChange(date)
  }

  /** Blur or Enter: the text becomes the date it names, written out. */
  const commit = () => {
    if (!text.trim()) return accept(undefined)
    const parsed = parseDate(text, locale)
    if (parsed && isWithin(parsed, minDate, maxDate)) {
      accept(parsed)
      setText(write(parsed))
    } else setInvalid(true)
  }

  return (
    <InputGroup
      data-slot="date-picker"
      data-disabled={disabled ? "true" : undefined}
      className={cn(datePickerVariants({ variant: "input" }), className)}
    >
      <InputGroupInput
        {...controlProps}
        ref={inputRef}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || ariaInvalid || undefined}
        autoComplete="off"
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          if (!next.trim()) return accept(undefined)
          // While typing, only a full year: "6/1/2" is not 2002 yet.
          const parsed = parseDate(next, locale, { fullYearOnly: true })
          if (parsed && isWithin(parsed, minDate, maxDate)) accept(parsed)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          if (event.key === "ArrowDown") {
            event.preventDefault()
            fromInput.current = true
            setKeyboard(true)
            onOpenChange(true)
          } else if (event.key === "Enter") commit()
        }}
        onBlur={(event) => {
          onBlur?.(event)
          commit()
        }}
      />
      <InputGroupAddon align="inline-end">
        <Popover
          open={open}
          onOpenChange={(next) => {
            if (next) fromInput.current = false
            onOpenChange(next)
          }}
        >
          <PopoverTrigger
            disabled={disabled}
            {...triggerProps}
            render={
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label={t("chooseDate")}
              />
            }
          >
            <CalendarIcon />
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
            aria-label={t("chooseDate")}
            initialFocus={keyboard ? false : undefined}
            finalFocus={() => (fromInput.current ? inputRef.current : true)}
          >
            <DayFocusContext value={keyboard}>
              <SingleCalendar
                value={value}
                onPick={(day) => {
                  accept(day)
                  setText(write(day))
                  onOpenChange(false)
                }}
                minDate={minDate}
                maxDate={maxDate}
                captionLayout={captionLayout}
              />
            </DayFocusContext>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}

/** Local midnight `days` days from today. */
function daysFromToday(days: number) {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
}

/** The range each named preset picks, as of now. */
const PRESET_RANGES: Record<DateRangePresetName, () => Required<DateRange>> = {
  today: () => ({ from: daysFromToday(0), to: daysFromToday(0) }),
  yesterday: () => ({ from: daysFromToday(-1), to: daysFromToday(-1) }),
  last7Days: () => ({ from: daysFromToday(-6), to: daysFromToday(0) }),
  last30Days: () => ({ from: daysFromToday(-29), to: daysFromToday(0) }),
  thisMonth: () => {
    const today = new Date()
    return {
      from: new Date(today.getFullYear(), today.getMonth(), 1),
      to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    }
  },
  lastMonth: () => {
    const today = new Date()
    return {
      from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      to: new Date(today.getFullYear(), today.getMonth(), 0),
    }
  },
}

/**
 * The calendar of a range: the first day picked starts a new range, the
 * second ends it (in either order), then `onPick`.
 */
function RangeCalendar({
  value,
  onPick,
  numberOfMonths,
  presets,
  minDate,
  maxDate,
}: {
  value: DateRange | undefined
  onPick: (range: Required<DateRange>) => void
  numberOfMonths: number
  presets: DateRangePickerProps["presets"]
  minDate?: Date
  maxDate?: Date
}) {
  const t = useTranslations("datePicker")
  const { locale, direction } = useLocale()
  const calendarLocale = useCalendarLocale(locale)
  const [start, setStart] = React.useState<Date | null>(null)
  const focusDay = React.useContext(DayFocusContext)
  if (calendarLocale === null) return <CalendarLoading />
  const selected = start
    ? { from: start, to: undefined }
    : value?.from
      ? { from: value.from, to: value.to }
      : undefined
  return (
    <>
      <Calendar
        mode="range"
        selected={selected}
        onSelect={(_, day) => {
          if (!start) return setStart(day)
          setStart(null)
          onPick(
            day < start ? { from: day, to: start } : { from: start, to: day }
          )
        }}
        defaultMonth={openingMonth(value?.from ?? value?.to, minDate, maxDate)}
        numberOfMonths={numberOfMonths}
        locale={calendarLocale}
        dir={direction}
        autoFocus={focusDay}
        {...calendarBounds(minDate, maxDate)}
      />
      {presets?.length ? (
        <div
          role="group"
          aria-label={t("presets")}
          data-slot="date-range-picker-presets"
          className="flex w-0 min-w-full flex-wrap gap-2 border-t p-3"
        >
          {presets.map((preset) => {
            const named = typeof preset === "string"
            return (
              <Button
                key={named ? preset : preset.label}
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const range = named ? PRESET_RANGES[preset]() : preset.value
                  onPick({ from: range.from!, to: range.to! })
                }}
              >
                {named ? t(preset) : preset.label}
              </Button>
            )
          })}
        </div>
      ) : null}
    </>
  )
}

/**
 * Tecton DateRangePicker — a range of days, picked on a calendar of two
 * months (`numberOfMonths`) in a popover, or with one of its `presets`.
 */
function DateRangePicker(props: DateRangePickerProps) {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    placeholder,
    disabled,
    minDate,
    maxDate,
    format,
    numberOfMonths = 2,
    presets,
    className,
    ...controlProps
  } = props
  const t = useTranslations("datePicker")
  const { locale } = useLocale()
  useCalendarLocale(locale)
  const [value, setValue] = useControllableState(
    "value" in props,
    valueProp,
    defaultValue,
    onValueChange
  )
  const [open, setOpen] = useControllableState(
    openProp !== undefined,
    openProp ?? false,
    defaultOpen,
    onOpenChange
  )
  const formatter = useFormatter(format, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const text = value?.from
    ? value.to
      ? formatter.formatRange(value.from, value.to)
      : formatter.format(value.from)
    : undefined

  return (
    <DateButton
      {...controlProps}
      slot="date-range-picker"
      className={cn(
        "w-60 justify-start px-2.5 text-start font-normal data-[empty=true]:text-muted-foreground",
        className
      )}
      text={text}
      placeholder={placeholder ?? t("rangePlaceholder")}
      icon={<CalendarIcon data-icon="inline-start" />}
      iconPosition="start"
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      popupLabel={t("chooseDateRange")}
    >
      <RangeCalendar
        value={value}
        onPick={(range) => {
          setValue(range)
          setOpen(false)
        }}
        numberOfMonths={numberOfMonths}
        presets={presets}
        minDate={minDate}
        maxDate={maxDate}
      />
    </DateButton>
  )
}

export { DatePicker, DateRangePicker, datePickerVariants }
export type {
  DatePickerProps,
  DateRange,
  DateRangePickerProps,
  DateRangePreset,
  DateRangePresetName,
}
