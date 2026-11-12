"use client"

/**
 * `DataTablePagination` (§4.4), for `pagination`: in one row, the
 * rows-per-page `Select`, the rows shown ("1–10 of 240", announced as it
 * changes) and Tecton's `Pagination` with the page buttons: previous, the
 * pages (the first, the last, the current one and its neighbours, an
 * ellipsis for the others) and next. The pages are buttons, not links: the
 * `Button` that `PaginationLink`'s look is (ghost, the current page
 * outline), in `PaginationItem`s. An ellipsis is a button too, "Go to
 * page", which opens the page picker: a `Popover` with a page field and Go
 * (`PagePicker`). The rows are the server's `rowCount` in server mode. It
 * renders nothing, and warns once in development, while `pagination` is
 * off.
 *
 * It stays on one line: it is a container (`@container`, the width it is
 * given, the footer's), and as that narrows it lets go of what it can
 * spare, in turn: the "Rows per page" label (the `Select` keeps it as its
 * name), the words of Previous and Next (their icons stay), the pages but
 * the current one and its neighbours (ellipses for the others), and below
 * about 400 px the page buttons, for "Page 3 of 5" between the arrows: a
 * button that opens the page picker too.
 *
 * Its controls keep their places as the page changes, so the one under the
 * pointer is pressed again: each row of pages has as many slots on every
 * page, and the rows shown and "Page 3 of 5" keep the width of their
 * widest text. The page picker opens over them, moving nothing.
 */
import * as React from "react"
import { cn } from "cn"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Field, FieldError, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@tecton/react/components/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/components/tooltip"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
  useNumberFormat,
  type DataTableContextValue,
} from "./context"

type DataTablePaginationProps = React.ComponentProps<"div"> & {
  /**
   * The page sizes the rows-per-page `Select` offers: the table's
   * `pageSizes` by default. An empty list leaves the `Select` out.
   */
  pageSizes?: ReadonlyArray<number>
}

/**
 * The widths (of the pagination, a container) below which it lets go of a
 * part (see the module comment), widest first.
 */
const NO_LABEL = "@max-[46rem]/data-table-pagination:hidden"
const NO_WORDS = "@max-[40rem]/data-table-pagination:hidden"
/** A page or ellipsis of the wide row only. */
const WIDE = "@max-[34rem]/data-table-pagination:hidden"
/** A page of both rows: gone only for "Page 3 of 5". */
const NEAR = "@max-[25rem]/data-table-pagination:hidden"
/** A page or ellipsis of the narrow row only. */
const NARROW =
  "hidden @max-[34rem]/data-table-pagination:block @max-[25rem]/data-table-pagination:hidden"
const PAGE_OF = "hidden @max-[25rem]/data-table-pagination:block"

/** A page's button, or an ellipsis: the pages before or after the ones shown. */
type Slot = number | "previous" | "next"

/**
 * The wide row: every page up to 7, else seven slots, the first page, the
 * last, the current one and its neighbours, and an ellipsis for the others
 * (five pages in a row at either end).
 */
function wideRow(page: number, pageCount: number): Array<Slot> {
  if (pageCount <= 7)
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, "next", pageCount]
  if (page >= pageCount - 3)
    return [
      1,
      "previous",
      pageCount - 4,
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ]
  return [1, "previous", page - 1, page, page + 1, "next", pageCount]
}

/**
 * The narrow row: every page up to 4, else five slots, the current page and
 * its neighbours between ellipses (four pages in a row at either end).
 */
function narrowRow(page: number, pageCount: number): Array<Slot> {
  if (pageCount <= 4)
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  if (page <= 2) return [1, 2, 3, 4, "next"]
  if (page >= pageCount - 1)
    return ["previous", pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
  return ["previous", page - 1, page, page + 1, "next"]
}

/**
 * The pages and ellipses of both rows, in order, each with the widths it
 * shows at. Each row keeps its number of slots as the page changes, so
 * Previous and Next stay where they are. A page is one button for both
 * rows (in the page once); an ellipsis is its row's own.
 */
function pageItems(page: number, pageCount: number) {
  const items = new Map<
    string,
    { slot: Slot; at: number; wide: boolean; narrow: boolean }
  >()
  for (const [row, slots] of [
    ["wide", wideRow(page, pageCount)],
    ["narrow", narrowRow(page, pageCount)],
  ] as const)
    slots.forEach((slot, index) => {
      // Between the pages around it: a page k at 2k, an ellipsis next to
      // its neighbour.
      const at =
        typeof slot === "number"
          ? 2 * slot
          : slot === "previous"
            ? 2 * (slots[index + 1] as number) - 1
            : 2 * (slots[index - 1] as number) + 1
      const key = typeof slot === "number" ? String(slot) : `${slot}-${row}`
      const item = items.get(key) ?? { slot, at, wide: false, narrow: false }
      item[row] = true
      items.set(key, item)
    })
  return [...items]
    .sort(([, a], [, b]) => a.at - b.at)
    .map(([key, { slot, wide, narrow }]) => ({
      key,
      slot,
      // Marked for the tests (jsdom has no container queries).
      row: wide && narrow ? undefined : wide ? "wide" : "narrow",
      className: wide && narrow ? NEAR : wide ? WIDE : NARROW,
    }))
}

function DataTablePagination({
  pageSizes: ownSizes,
  className,
  ...props
}: DataTablePaginationProps) {
  const context = useDataTableContext<unknown>("DataTablePagination")
  const on = useDataTableSelector(context, (state) => state.options.pagination)
  useFeatureWarning(context, !on, "DataTablePagination", "pagination")
  if (!on) return null
  return (
    <div
      data-slot="data-table-pagination"
      className={cn(
        "@container/data-table-pagination min-w-0 flex-1 text-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-end gap-x-6 whitespace-nowrap @max-[34rem]/data-table-pagination:gap-x-3 @max-[25rem]/data-table-pagination:gap-x-2">
        <PageSize context={context} ownSizes={ownSizes} />
        <RowRange context={context} />
        <PageButtons context={context} />
      </div>
    </div>
  )
}

/** "Rows per page" and a `Select` of the page sizes. */
function PageSize({
  context,
  ownSizes,
}: {
  context: DataTableContextValue<unknown>
  ownSizes: ReadonlyArray<number> | undefined
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const pageSize = useDataTableSelector(
    context,
    (state) => state.model.pageSize
  )
  const tableSizes = useDataTableSelector(
    context,
    (state) => state.options.pageSizes
  )
  const pageSizes = ownSizes ?? tableSizes
  // A page size the list leaves out is still one to choose.
  const sizes = React.useMemo(
    () =>
      pageSizes.includes(pageSize)
        ? pageSizes
        : [...pageSizes, pageSize].sort((a, b) => a - b),
    [pageSizes, pageSize]
  )
  if (pageSizes.length === 0) return null
  return (
    <div data-slot="data-table-page-size" className="flex items-center gap-2">
      {/* The `Select`'s name is its own: this label can go. */}
      <span aria-hidden className={NO_LABEL}>
        {t("rowsPerPage")}
      </span>
      <Select
        value={String(pageSize)}
        onValueChange={(value, eventDetails) => {
          if (value !== null)
            context.actions.setPageSize(
              Number(value),
              "select",
              eventDetails.event
            )
        }}
      >
        <SelectTrigger size="sm" className="w-18" aria-label={t("rowsPerPage")}>
          <SelectValue>
            {(value: string) => format.format(Number(value))}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sizes.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {format.format(size)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Text that keeps the width of its widest value (`data-widest`), so the
 * parts after it stay where they are as it changes: "1–10" and "11–20",
 * "Page 9" and "Page 10". The widest value is drawn hidden, under the text.
 */
const STEADY =
  "grid tabular-nums before:invisible before:col-start-1 before:row-start-1 before:content-[attr(data-widest)] *:col-start-1 *:row-start-1"

/** "1–10 of 240": the rows of the page, announced as they change. */
function RowRange({ context }: { context: DataTableContextValue<unknown> }) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const page = useDataTableSelector(context, (state) => state.model.page)
  const pageSize = useDataTableSelector(
    context,
    (state) => state.model.pageSize
  )
  // The rows the pages count: the server's, or the item and group rows.
  const total = useDataTableSelector(context, (state) =>
    state.options.dataMode === "server"
      ? state.model.rowCount
      : state.model.displayRowCount
  )
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <span
      data-slot="data-table-row-range"
      aria-live="polite"
      aria-atomic="true"
      data-widest={t("rowRange", {
        from: format.format(total),
        to: format.format(total),
        total: format.format(total),
      })}
      className={cn("justify-items-end text-muted-foreground", STEADY)}
    >
      <span>
        {t("rowRange", {
          from: format.format(from),
          to: format.format(to),
          total: format.format(total),
        })}
      </span>
    </span>
  )
}

/** A place that does not move: where the picker's trigger was as it closed. */
type FixedPlace = { getBoundingClientRect: () => DOMRect }

/**
 * Previous, the pages and next: `Pagination`'s parts, as buttons. The
 * ellipses and "Page 3 of 5" are the triggers of one page picker.
 */
function PageButtons({ context }: { context: DataTableContextValue<unknown> }) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const page = useDataTableSelector(context, (state) => state.model.page)
  const pageCount = useDataTableSelector(
    context,
    (state) => state.model.pageCount
  )
  // Read when pressed: the page a click lands on is the current one's neighbour.
  const current = () => context.store.get().model.page
  const nav = React.useRef<HTMLElement>(null)

  // The page picker: one popover, opened by the trigger pressed (an
  // ellipsis or "Page 3 of 5", each with its own id) and placed by it.
  const id = React.useId()
  const pageOfId = `${id}page-of`
  const [open, setOpen] = React.useState(false)
  const [triggerId, setTriggerId] = React.useState<string | null>(null)
  // As it closes, it stays where it was: a page picked may take its
  // ellipsis away (the first or last pages now in view).
  const [held, setHeld] = React.useState<FixedPlace | undefined>()
  // A page picked: focus goes to it, not back to the trigger.
  const picked = React.useRef(false)
  const field = React.useRef<HTMLInputElement>(null)

  const hold = () => {
    const trigger = triggerId ? document.getElementById(triggerId) : null
    if (!trigger?.isConnected) return
    const rect = trigger.getBoundingClientRect()
    setHeld({ getBoundingClientRect: () => rect })
  }
  const onOpenChange = (
    next: boolean,
    details: { trigger?: Element | undefined }
  ) => {
    if (next) {
      setTriggerId(details.trigger?.id || null)
      setHeld(undefined)
      picked.current = false
    } else if (open) hold()
    setOpen(next)
  }
  const pick = (to: number, event: Event) => {
    picked.current = true
    hold()
    setOpen(false)
    context.actions.setPage(to, "page", event)
  }

  const pages = pageItems(page, pageCount).map(
    ({ key, slot, row, className }) =>
      typeof slot === "number" ? (
        <PaginationItem
          key={key}
          data-wide={row === "wide" ? "" : undefined}
          className={className}
        >
          <Button
            variant={slot === page ? "outline" : "ghost"}
            size="icon"
            aria-current={slot === page ? "page" : undefined}
            aria-label={t("goToPage", { page: format.format(slot) })}
            className="tabular-nums"
            onClick={(event: React.MouseEvent) =>
              context.actions.setPage(slot, "page", event.nativeEvent)
            }
          >
            {format.format(slot)}
          </Button>
        </PaginationItem>
      ) : (
        <PaginationItem
          key={key}
          data-wide={row === "wide" ? "" : undefined}
          data-narrow={row === "narrow" ? "" : undefined}
          className={className}
        >
          <PagePickerEllipsis
            id={`${id}${key}`}
            direction={slot}
            // Its tooltip waits while its picker is open.
            pickerOpen={open && triggerId === `${id}${key}`}
          />
        </PaginationItem>
      )
  )
  return (
    <Popover
      open={open}
      triggerId={triggerId}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(next) => {
        if (!next) setHeld(undefined)
      }}
    >
      <Pagination
        ref={nav}
        aria-label={t("pagination")}
        className="mx-0 w-auto justify-end"
      >
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              className={cn(
                "ps-2!",
                // Its icon alone: a square button.
                "@max-[40rem]/data-table-pagination:size-9 @max-[40rem]/data-table-pagination:px-0!"
              )}
              aria-label={t("previousPage")}
              // Focus stays on the button that reached the first page.
              focusableWhenDisabled
              disabled={page <= 1}
              onClick={(event: React.MouseEvent) =>
                context.actions.setPage(
                  current() - 1,
                  "previous",
                  event.nativeEvent
                )
              }
            >
              <ChevronLeftIcon
                data-icon="inline-start"
                className="rtl:rotate-180"
              />
              <span className={NO_WORDS}>{t("previous")}</span>
            </Button>
          </PaginationItem>
          {pages}
          <PaginationItem className={PAGE_OF}>
            {/* No page buttons at this width: "Page 3 of 5" picks the page. */}
            <PopoverTrigger
              id={pageOfId}
              render={<Button variant="ghost" className="px-2" />}
            >
              <span
                data-slot="data-table-page-of"
                data-widest={t("pageOf", {
                  page: format.format(Math.max(pageCount, 1)),
                  pageCount: format.format(Math.max(pageCount, 1)),
                })}
                className={cn("justify-items-center", STEADY)}
              >
                <span>
                  {t("pageOf", {
                    page: format.format(page),
                    pageCount: format.format(Math.max(pageCount, 1)),
                  })}
                </span>
              </span>
            </PopoverTrigger>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              className={cn(
                "pe-2!",
                "@max-[40rem]/data-table-pagination:size-9 @max-[40rem]/data-table-pagination:px-0!"
              )}
              aria-label={t("nextPage")}
              // Focus stays on the button that reached the last page.
              focusableWhenDisabled
              disabled={page >= pageCount}
              onClick={(event: React.MouseEvent) =>
                context.actions.setPage(
                  current() + 1,
                  "next",
                  event.nativeEvent
                )
              }
            >
              <span className={NO_WORDS}>{t("next")}</span>
              <ChevronRightIcon
                data-icon="inline-end"
                className="rtl:rotate-180"
              />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <PopoverContent
        data-slot="data-table-page-picker"
        anchor={held}
        initialFocus={field}
        finalFocus={() => {
          if (!picked.current) return true
          picked.current = false
          // From "Page 3 of 5", back to it (the only page control there);
          // else to the page picked, which is in view at that width.
          if (triggerId === pageOfId) return true
          return (
            nav.current?.querySelector<HTMLElement>('[aria-current="page"]') ??
            true
          )
        }}
        className="w-56"
      >
        <PagePicker
          field={field}
          page={page}
          pageCount={Math.max(pageCount, 1)}
          onPick={pick}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * An ellipsis: `Pagination`'s dots, a ghost icon button named "Go to page"
 * (also its tooltip), which opens the page picker.
 */
function PagePickerEllipsis({
  id,
  direction,
  pickerOpen,
}: {
  id: string
  direction: "previous" | "next"
  pickerOpen: boolean
}) {
  const t = useTranslations("dataTable")
  const label = t("pagePicker")
  return (
    <Tooltip disabled={pickerOpen}>
      <TooltipTrigger
        render={
          <PopoverTrigger
            id={id}
            render={
              <Button
                variant="ghost"
                size="icon"
                data-ellipsis={direction}
                aria-label={label}
              />
            }
          />
        }
      >
        <MoreHorizontalIcon aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const DIGITS: ReadonlyArray<[first: number, last: number]> = [
  [0x30, 0x39], // 0–9
  [0x660, 0x669], // Arabic-Indic
  [0x6f0, 0x6f9], // Extended Arabic-Indic (Persian, Urdu)
  [0xff10, 0xff19], // Fullwidth (Japanese and Chinese input)
]

/** The digits of `text`, as 0–9: a whole number has nothing else. */
function digitsOf(text: string) {
  let digits = ""
  for (const char of text) {
    const code = char.codePointAt(0)!
    const range = DIGITS.find(([first, last]) => code >= first && code <= last)
    if (range) digits += String(code - range[0])
  }
  return digits
}

/**
 * The page picker's form: a page field ("Go to page", its hint the pages
 * there are, "1–24") and Go. Enter or Go picks the page; a page outside
 * 1 to `pageCount`, or none, is refused with the field's error. It opens
 * empty, its hint in view. The field takes digits only (a whole number),
 * and the up and down arrows step through the pages, from the current one,
 * kept within them.
 */
function PagePicker({
  field,
  page,
  pageCount,
  onPick,
}: {
  field: React.RefObject<HTMLInputElement | null>
  page: number
  pageCount: number
  onPick: (page: number, event: Event) => void
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const id = React.useId()
  const [text, setText] = React.useState("")
  // Refused once: the error follows the text from then on.
  const [refused, setRefused] = React.useState(false)
  const value = text === "" ? null : Number(text)
  const valid = value !== null && value >= 1 && value <= pageCount
  const invalid = refused && !valid
  const range = {
    from: format.format(1),
    to: format.format(pageCount),
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) onPick(value, event.nativeEvent)
        else {
          setRefused(true)
          field.current?.focus()
        }
      }}
    >
      <Field data-invalid={invalid || undefined} className="gap-2">
        <FieldLabel htmlFor={`${id}-page`}>{t("pagePicker")}</FieldLabel>
        <div className="flex gap-2">
          <Input
            ref={field}
            id={`${id}-page`}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            placeholder={t("pagePickerHint", range)}
            value={text}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${id}-error` : undefined}
            className="min-w-0 flex-1 tabular-nums"
            onChange={(event) => setText(digitsOf(event.currentTarget.value))}
            onKeyDown={(event) => {
              if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
              event.preventDefault()
              const from = value ?? page
              const to = from + (event.key === "ArrowUp" ? 1 : -1)
              setText(String(Math.min(Math.max(to, 1), pageCount)))
            }}
          />
          <Button type="submit">{t("pagePickerGo")}</Button>
        </div>
        {invalid && (
          <FieldError id={`${id}-error`}>
            {t("pagePickerInvalid", range)}
          </FieldError>
        )}
      </Field>
    </form>
  )
}

export { DataTablePagination }
export type { DataTablePaginationProps }
