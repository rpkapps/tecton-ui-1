import * as React from "react"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  DatePicker,
  DateRangePicker,
  type DateRange,
} from "@tecton/react/date-picker"
import { TectonProvider } from "@tecton/react/provider"

import { loadCalendarLocale } from "../internal/calendar-locale"
import { parseDate } from "../internal/date-text"
import { loadTranslations } from "../internal/i18n/translations"

const JUNE_1 = new Date(2025, 5, 1)

function en(ui: React.ReactElement) {
  return render(<TectonProvider locale="en-US">{ui}</TectonProvider>)
}

/** The day button of `date` in the open calendar (`data-day` is in `locale`). */
function day(date: Date, locale = "en-US") {
  const text = date.toLocaleDateString(locale, { calendar: "gregory" })
  const button = document.querySelector<HTMLButtonElement>(
    `[data-slot="popover-content"] button[data-day="${text}"]`
  )
  if (!button) throw new Error(`no day ${text} in the calendar`)
  return button
}

describe("DatePicker", () => {
  it("shows the placeholder, opens with Enter, focuses the day, picks one, closes and refocuses the trigger", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    en(<DatePicker defaultValue={JUNE_1} onValueChange={onValueChange} />)
    const trigger = screen.getByRole("button", { name: "June 1, 2025" })
    expect(trigger).toHaveAttribute("data-slot", "date-picker")
    expect(trigger).toHaveAttribute("data-empty", "false")

    trigger.focus()
    await user.keyboard("{Enter}")
    const dialog = await screen.findByRole("dialog", { name: "Choose a date" })
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(day(JUNE_1)).toHaveFocus())

    // The arrows move through the days; Enter picks.
    await user.keyboard("{ArrowRight}{Enter}")
    expect(onValueChange).toHaveBeenCalledWith(new Date(2025, 5, 2))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(trigger).toHaveTextContent("June 2, 2025")
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it("focuses no day when opened with a pointer", async () => {
    const user = userEvent.setup()
    en(<DatePicker defaultValue={JUNE_1} />)
    await user.click(screen.getByRole("button"))
    const dialog = await screen.findByRole("dialog")
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    )
    expect(day(JUNE_1)).not.toHaveFocus()
  })

  it("opens with Space, closes on Escape without a change and refocuses the trigger", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const onOpenChange = vi.fn()
    en(<DatePicker onValueChange={onValueChange} onOpenChange={onOpenChange} />)
    const trigger = screen.getByRole("button", { name: "Pick a date" })
    expect(trigger).toHaveAttribute("data-empty", "true")
    trigger.focus()
    await user.keyboard(" ")
    await screen.findByRole("dialog")
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onValueChange).not.toHaveBeenCalled()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it("is controlled by value and open", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = en(
      <DatePicker value={JUNE_1} onValueChange={onValueChange} open />
    )
    await screen.findByRole("dialog")
    await user.click(day(new Date(2025, 5, 10)))
    expect(onValueChange).toHaveBeenCalledWith(new Date(2025, 5, 10))
    // The owner has not changed it: still June 1, still open.
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      document.querySelector('[data-slot="date-picker"]')
    ).toHaveTextContent("June 1, 2025")

    rerender(
      <TectonProvider locale="en-US">
        <DatePicker value={undefined} open={false} />
      </TectonProvider>
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(screen.getByRole("button")).toHaveTextContent("Pick a date")
  })

  it("keeps the label as the name and describes the trigger with the date", () => {
    en(
      <>
        <label htmlFor="spud">Spud date</label>
        <DatePicker id="spud" defaultValue={JUNE_1} />
      </>
    )
    const trigger = screen.getByRole("button", { name: "Spud date" })
    expect(trigger).toHaveAccessibleDescription("June 1, 2025")
  })

  it("disables the days outside minDate and maxDate", async () => {
    const user = userEvent.setup()
    en(
      <DatePicker
        defaultValue={new Date(2025, 5, 15)}
        minDate={new Date(2025, 5, 10)}
        maxDate={new Date(2025, 5, 20)}
      />
    )
    await user.click(screen.getByRole("button"))
    await screen.findByRole("dialog")
    expect(day(new Date(2025, 5, 9))).toBeDisabled()
    expect(day(new Date(2025, 5, 10))).toBeEnabled()
    expect(day(new Date(2025, 5, 20))).toBeEnabled()
    expect(day(new Date(2025, 5, 21))).toBeDisabled()
  })

  it("submits the day as YYYY-MM-DD under its name", () => {
    const { container } = en(<DatePicker name="spud" defaultValue={JUNE_1} />)
    expect(container.querySelector('input[name="spud"]')).toHaveValue(
      "2025-06-01"
    )
  })

  it("submits nothing when disabled", () => {
    const { container } = en(
      <form>
        <DatePicker name="spud" defaultValue={JUNE_1} disabled />
      </form>
    )
    expect(container.querySelector('input[name="spud"]')).toBeDisabled()
    expect(new FormData(container.querySelector("form")!).has("spud")).toBe(
      false
    )
  })

  it("does not open when disabled", async () => {
    const user = userEvent.setup()
    en(<DatePicker disabled />)
    await user.click(screen.getByRole("button"))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("clears the date with Clear, closes and refocuses the trigger", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = en(
      <DatePicker
        name="spud"
        defaultValue={JUNE_1}
        onValueChange={onValueChange}
      />
    )
    const trigger = screen.getByRole("button", { name: "June 1, 2025" })
    await user.click(trigger)
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Clear" }))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(undefined)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveTextContent("Pick a date")
    expect(trigger).toHaveAttribute("data-empty", "true")
    expect(container.querySelector('input[name="spud"]')).toHaveValue("")

    // No date, no Clear.
    await user.click(trigger)
    const empty = await screen.findByRole("dialog")
    expect(within(empty).queryByRole("button", { name: "Clear" })).toBeNull()
  })

  it("asks the owner to clear a controlled date", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    en(<DatePicker value={JUNE_1} onValueChange={onValueChange} />)
    const trigger = screen.getByRole("button", { name: "June 1, 2025" })
    await user.click(trigger)
    await user.click(await screen.findByRole("button", { name: "Clear" }))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(undefined)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    // The owner has not changed it.
    expect(trigger).toHaveTextContent("June 1, 2025")
  })
})

describe("DatePicker variant=input", () => {
  function Input(props: React.ComponentProps<typeof DatePicker>) {
    return (
      <>
        <label htmlFor="date">Date</label>
        <DatePicker id="date" variant="input" {...props} />
      </>
    )
  }

  it("takes a typed date once its year is complete and writes it out on blur", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    en(<Input onValueChange={onValueChange} />)
    const input = screen.getByRole("textbox", { name: "Date" })
    await user.type(input, "6/15/2")
    expect(onValueChange).not.toHaveBeenCalled()
    await user.type(input, "025")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2025, 5, 15))
    expect(input).toHaveValue("6/15/2025")
    await user.tab()
    expect(input).toHaveValue("June 15, 2025")
    expect(input).not.toHaveAttribute("aria-invalid")
  })

  it("marks text that is no date invalid, and clears the date with the text", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    en(<Input defaultValue={JUNE_1} onValueChange={onValueChange} />)
    const input = screen.getByRole("textbox", { name: "Date" })
    expect(input).toHaveValue("June 1, 2025")
    await user.clear(input)
    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
    await user.type(input, "not a date{Enter}")
    expect(input).toHaveAttribute("aria-invalid", "true")
    await user.clear(input)
    await user.type(input, "2025-06-03{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2025, 5, 3))
    expect(input).not.toHaveAttribute("aria-invalid")
    expect(input).toHaveValue("June 3, 2025")
  })

  it("opens the calendar with Alt+ArrowDown and gives focus back to the input", async () => {
    const user = userEvent.setup()
    en(<Input defaultValue={JUNE_1} />)
    const input = screen.getByRole("textbox", { name: "Date" })
    input.focus()
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}")
    await screen.findByRole("dialog", { name: "Choose a date" })
    await waitFor(() => expect(day(JUNE_1)).toHaveFocus())
    await user.keyboard("{ArrowDown}{Enter}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(input).toHaveValue("June 8, 2025")
    await waitFor(() => expect(input).toHaveFocus())
  })

  it("opens from its calendar button, which is named", async () => {
    const user = userEvent.setup()
    en(<Input />)
    const button = screen.getByRole("button", { name: "Choose a date" })
    await user.click(button)
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(button).toHaveFocus())
  })

  it("follows a value changed from outside", () => {
    const { rerender } = en(<Input value={JUNE_1} />)
    rerender(
      <TectonProvider locale="en-US">
        <Input value={new Date(2025, 11, 24)} />
      </TectonProvider>
    )
    expect(screen.getByRole("textbox")).toHaveValue("December 24, 2025")
  })

  it("has no Clear in its calendar: emptying the text clears", async () => {
    const user = userEvent.setup()
    en(<Input defaultValue={JUNE_1} />)
    await user.click(screen.getByRole("button", { name: "Choose a date" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByRole("button", { name: "Clear" })).toBeNull()
  })
})

describe("DateRangePicker", () => {
  it("picks a range with two days, in either order, then closes", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    en(
      <DateRangePicker
        defaultValue={{ from: JUNE_1, to: new Date(2025, 5, 3) }}
        onValueChange={onValueChange}
      />
    )
    const trigger = screen.getByRole("button", { name: /^Jun 1\s–\s3, 2025$/ })
    expect(trigger).toHaveAttribute("data-slot", "date-range-picker")
    await user.click(trigger)
    await screen.findByRole("dialog", { name: "Choose a date range" })
    // Two months side by side by default.
    expect(
      document.querySelectorAll('[data-slot="popover-content"] table')
    ).toHaveLength(2)
    await user.click(day(new Date(2025, 5, 20)))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await user.click(day(new Date(2025, 5, 12)))
    expect(onValueChange).toHaveBeenCalledWith({
      from: new Date(2025, 5, 12),
      to: new Date(2025, 5, 20),
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(trigger).toHaveTextContent("Jun 12 – 20, 2025")
  })

  it("picks a preset at once, by name or of its own", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const quarter: DateRange = {
      from: new Date(2025, 0, 1),
      to: new Date(2025, 2, 31),
    }
    en(
      <DateRangePicker
        onValueChange={onValueChange}
        presets={["last7Days", "thisMonth", { label: "Q1", value: quarter }]}
      />
    )
    const trigger = screen.getByRole("button", { name: "Pick a date range" })
    await user.click(trigger)
    const presets = await screen.findByRole("group", { name: "Presets" })
    expect(presets).toHaveTextContent("Last 7 daysThis monthQ1")

    await user.click(screen.getByRole("button", { name: "Last 7 days" }))
    const today = new Date()
    expect(onValueChange).toHaveBeenLastCalledWith({
      from: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 6
      ),
      to: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())

    await user.click(trigger)
    await user.click(await screen.findByRole("button", { name: "Q1" }))
    expect(onValueChange).toHaveBeenLastCalledWith(quarter)
    expect(trigger).toHaveTextContent("Jan 1 – Mar 31, 2025")
  })

  it("disables the presets outside minDate and maxDate, in their place", async () => {
    const user = userEvent.setup()
    en(
      <DateRangePicker
        minDate={new Date(2025, 5, 10)}
        maxDate={new Date(2025, 5, 20)}
        presets={[
          "yesterday",
          {
            label: "Early June",
            value: { from: JUNE_1, to: new Date(2025, 5, 9) },
          },
          {
            label: "Mid June",
            value: { from: JUNE_1, to: new Date(2025, 5, 30) },
          },
          {
            label: "July",
            value: { from: new Date(2025, 6, 1), to: new Date(2025, 6, 31) },
          },
          { label: "Nothing", value: {} },
        ]}
      />
    )
    await user.click(screen.getByRole("button"))
    const presets = await screen.findByRole("group", { name: "Presets" })
    expect(presets).toHaveTextContent("YesterdayEarly JuneMid JuneJulyNothing")
    const button = (name: string) =>
      within(presets).getByRole("button", { name })
    expect(button("Yesterday")).toBeDisabled()
    expect(button("Early June")).toBeDisabled()
    expect(button("Mid June")).toBeEnabled()
    expect(button("July")).toBeDisabled()
    expect(button("Nothing")).toBeDisabled()
  })

  it("clamps a preset that crosses minDate or maxDate to them", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    en(
      <DateRangePicker
        // A bound with a time of day still bounds by day.
        minDate={now}
        onValueChange={onValueChange}
        presets={["yesterday", "last30Days"]}
      />
    )
    const trigger = screen.getByRole("button")
    await user.click(trigger)
    expect(
      await screen.findByRole("button", { name: "Yesterday" })
    ).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Last 30 days" }))
    expect(onValueChange).toHaveBeenLastCalledWith({ from: today, to: today })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("clamps a preset of its own on both sides", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    en(
      <DateRangePicker
        minDate={new Date(2025, 5, 10)}
        maxDate={new Date(2025, 5, 20, 18, 30)}
        onValueChange={onValueChange}
        presets={[
          { label: "June", value: { from: JUNE_1, to: new Date(2025, 5, 30) } },
        ]}
      />
    )
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByRole("button", { name: "June" }))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
      from: new Date(2025, 5, 10),
      to: new Date(2025, 5, 20),
    })
  })

  it("picks a preset of its own without `to` as one day", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const spud = new Date(2025, 5, 3)
    en(
      <DateRangePicker
        onValueChange={onValueChange}
        presets={[{ label: "Spud day", value: { from: spud } }]}
      />
    )
    const trigger = screen.getByRole("button")
    await user.click(trigger)
    await user.click(await screen.findByRole("button", { name: "Spud day" }))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith({
      from: spud,
      to: spud,
    })
    expect(trigger).toHaveTextContent("Jun 3, 2025")
  })

  it("clears the range with Clear, closes and refocuses the trigger", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    en(
      <DateRangePicker
        defaultValue={{ from: JUNE_1, to: new Date(2025, 5, 3) }}
        onValueChange={onValueChange}
        presets={["last7Days"]}
      />
    )
    const trigger = screen.getByRole("button", { name: /^Jun 1\s–\s3, 2025$/ })
    trigger.focus()
    await user.keyboard("{Enter}")
    const dialog = await screen.findByRole("dialog")
    const clear = within(dialog).getByRole("button", { name: "Clear" })
    // After the calendar and its presets.
    expect(clear.closest('[data-slot="date-picker-footer"]')).toBe(
      dialog.lastElementChild
    )
    await user.click(clear)
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(undefined)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveTextContent("Pick a date range")
    expect(trigger).toHaveAttribute("data-empty", "true")

    await user.click(trigger)
    const empty = await screen.findByRole("dialog")
    expect(within(empty).queryByRole("button", { name: "Clear" })).toBeNull()
  })

  it("shows no Clear without a range", async () => {
    const user = userEvent.setup()
    en(<DateRangePicker presets={["today"]} />)
    await user.click(screen.getByRole("button"))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByRole("button", { name: "Clear" })).toBeNull()
    expect(dialog.querySelector('[data-slot="date-picker-footer"]')).toBeNull()
  })

  it("asks the owner to clear a controlled range", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const range = { from: JUNE_1, to: new Date(2025, 5, 3) }
    const { rerender } = en(
      <DateRangePicker value={range} onValueChange={onValueChange} />
    )
    const trigger = screen.getByRole("button")
    await user.click(trigger)
    await user.click(await screen.findByRole("button", { name: "Clear" }))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(undefined)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    // The owner has not changed it: still the range, Clear still offered.
    expect(trigger).toHaveTextContent("Jun 1 – 3, 2025")
    await user.click(trigger)
    expect(
      await screen.findByRole("button", { name: "Clear" })
    ).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())

    rerender(
      <TectonProvider locale="en-US">
        <DateRangePicker value={undefined} onValueChange={onValueChange} />
      </TectonProvider>
    )
    expect(trigger).toHaveTextContent("Pick a date range")
    await user.click(trigger)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByRole("button", { name: "Clear" })).toBeNull()
  })

  it("shows numberOfMonths months", async () => {
    const user = userEvent.setup()
    en(<DateRangePicker numberOfMonths={1} />)
    await user.click(screen.getByRole("button"))
    await screen.findByRole("dialog")
    expect(
      document.querySelectorAll('[data-slot="popover-content"] table')
    ).toHaveLength(1)
  })
})

describe("locale and direction", () => {
  it("formats, translates and parses in the provider's locale", async () => {
    await act(() =>
      Promise.all([loadTranslations("de-DE"), loadCalendarLocale("de-DE")])
    )
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <TectonProvider locale="de-DE">
        <DatePicker defaultValue={JUNE_1} />
        <DatePicker variant="input" onValueChange={onValueChange} />
        <DateRangePicker presets={["today"]} />
      </TectonProvider>
    )
    expect(
      screen.getByRole("button", { name: "1. Juni 2025" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Zeitraum auswählen" })
    ).toBeInTheDocument()
    const input = screen.getByPlaceholderText("Datum auswählen")
    await user.type(input, "15.06.2025")
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2025, 5, 15))
    await user.tab()
    expect(input).toHaveValue("15. Juni 2025")

    // The calendar in German, its weeks starting on Monday.
    await user.click(screen.getByRole("button", { name: "1. Juni 2025" }))
    const dialog = await screen.findByRole("dialog", {
      name: "Datum auswählen",
    })
    expect(dialog).toHaveTextContent("Juni 2025")
    expect(dialog.querySelector("thead th")).toHaveTextContent("Mo")
  })

  it("lays the calendar out right to left, where the arrows follow", async () => {
    await act(() =>
      Promise.all([loadTranslations("he-IL"), loadCalendarLocale("he-IL")])
    )
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <TectonProvider locale="he-IL">
        <DatePicker defaultValue={JUNE_1} onValueChange={onValueChange} />
      </TectonProvider>
    )
    screen.getByRole("button").focus()
    await user.keyboard("{Enter}")
    const dialog = await screen.findByRole("dialog", { name: "בחירת תאריך" })
    expect(dialog.querySelector('[data-slot="calendar"]')).toHaveAttribute(
      "dir",
      "rtl"
    )
    await waitFor(() => expect(day(JUNE_1, "he")).toHaveFocus())
    // Left is the next day in a right-to-left calendar.
    await user.keyboard("{ArrowLeft}{Enter}")
    expect(onValueChange).toHaveBeenCalledWith(new Date(2025, 5, 2))
  })
})

describe("parseDate", () => {
  it("reads what each locale writes, numeric dates in its order, and ISO", () => {
    const cases: Array<[string, string]> = [
      ["en-US", "June 1, 2025"],
      ["en-US", "6/1/2025"],
      ["en-US", "Jun 1 2025"],
      ["en-GB", "1/6/2025"],
      ["de-DE", "1. Juni 2025"],
      ["de-DE", "01.06.2025"],
      ["fr-FR", "1 juin 2025"],
      ["ru-RU", "1 июня 2025 г."],
      ["he-IL", "1 ביוני 2025"],
      ["ar-EG", "١ يونيو ٢٠٢٥"],
      ["ja-JP", "2025年6月1日日曜日"],
      ["hu-HU", "2025. június 1."],
      ["nl-NL", "2025-06-01"],
    ]
    for (const [locale, text] of cases)
      expect([locale, text, parseDate(text, locale)]).toEqual([
        locale,
        text,
        JUNE_1,
      ])
  })

  it("refuses what names no day", () => {
    expect(parseDate("31/02/2025", "en-GB")).toBeNull()
    expect(parseDate("foo 1 2 2025", "en-US")).toBeNull()
    expect(parseDate("6/1/2", "en-US", { fullYearOnly: true })).toBeNull()
    expect(parseDate("", "en-US")).toBeNull()
  })
})
