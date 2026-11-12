"use client"

/**
 * `DataTablePagination` (§4.4), for `pagination`: a spreadsheet's strip, on
 * one line. At the start, the rows-per-page `Select` with its "Rows" label
 * and the rows shown ("21–30 of 50", announced as it changes); at the end,
 * Tecton's `Pagination` with First, Previous, the page field ("Page [3] of
 * 5", a `NumberInput` from 1 to the last page) and Next, Last. The rows are
 * the server's `rowCount` in server mode. It renders nothing, and warns
 * once in development, while `pagination` is off.
 *
 * The page field: Enter opens the page typed, clamped to the pages there
 * are (an empty field goes back to the current page); losing focus opens
 * it too, but a page outside them, a fraction or nothing goes back to the
 * current one. The arrow keys step through the pages at once, Home and End
 * go to the first and the last. Each is reported with the reason `"page"`.
 *
 * Its controls follow the table's `size`: `icon-sm` buttons, the default
 * `Select` and field by default; `icon-xs` buttons, the small `Select` and
 * field when compact (`DataTableFooter` makes the band a row's height).
 *
 * It stays on one line: it is a container (`@container`, the width it is
 * given, the footer's), and as that narrows it lets go of what matters
 * least, in turn (`STEPS`): the "Rows" label (the `Select` keeps its name,
 * "Rows per page"), the `Select`, First and Last, the words around the
 * field ("[3] / 5" instead), and the rows shown. Previous, the field and
 * Next always stay. Its controls keep their places as the page changes:
 * the rows shown keep the width of their widest text, the field the width
 * of the last page.
 */
import * as React from "react"
import { cn } from "cn"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { Button } from "@tecton/react/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@tecton/react/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/select"
import { NumberInput } from "@tecton/react/number-input"

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

type Size = "default" | "sm"

/**
 * How wide the strip is, for the widths its parts go at (`data-fit`): the
 * table's size, and the digits of the last page (the field, "of 5" and the
 * rows shown widen with them).
 */
type Fit = `${Size}-${"short" | "mid" | "long"}`

function fitOf(size: Size, pageCount: number): Fit {
  const digits = String(pageCount).length
  return `${size}-${digits <= 2 ? "short" : digits === 3 ? "mid" : "long"}`
}

/**
 * The container widths below which each part goes, in the order they go,
 * by `data-fit`. Each is the width the strip needs with that part still
 * there (and the ones before it gone), measured in the browser at its
 * widest: in German, whose words are the longest of the locales, with 100
 * rows a page and 99, 999 or 1,240 pages, plus 4 px (16 px past 999 pages,
 * for five digits and more). The classes are written out in full for
 * Tailwind. `data-step` names each part for the tests (jsdom has no
 * container queries).
 */
const STEPS = {
  /** 1. The "Rows" label. */
  label: [
    "group-data-[fit=default-short]/data-table-pagination:@max-[35.125rem]/data-table-pagination:hidden",
    "group-data-[fit=default-mid]/data-table-pagination:@max-[37.25rem]/data-table-pagination:hidden",
    "group-data-[fit=default-long]/data-table-pagination:@max-[41.125rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-short]/data-table-pagination:@max-[31.75rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-mid]/data-table-pagination:@max-[33.5rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-long]/data-table-pagination:@max-[36.75rem]/data-table-pagination:hidden",
  ].join(" "),
  /** 2. The rows-per-page `Select`. */
  pageSize: [
    "group-data-[fit=default-short]/data-table-pagination:@max-[32.125rem]/data-table-pagination:hidden",
    "group-data-[fit=default-mid]/data-table-pagination:@max-[34.375rem]/data-table-pagination:hidden",
    "group-data-[fit=default-long]/data-table-pagination:@max-[38.25rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-short]/data-table-pagination:@max-[29.125rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-mid]/data-table-pagination:@max-[31rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-long]/data-table-pagination:@max-[34.25rem]/data-table-pagination:hidden",
  ].join(" "),
  /** 3. First and Last. */
  ends: [
    "group-data-[fit=default-short]/data-table-pagination:@max-[27.125rem]/data-table-pagination:hidden",
    "group-data-[fit=default-mid]/data-table-pagination:@max-[29.25rem]/data-table-pagination:hidden",
    "group-data-[fit=default-long]/data-table-pagination:@max-[33.25rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-short]/data-table-pagination:@max-[24.125rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-mid]/data-table-pagination:@max-[26rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-long]/data-table-pagination:@max-[29.25rem]/data-table-pagination:hidden",
  ].join(" "),
  /** 4. "Page" and "of 5" around the field: "/ 5" after it instead. */
  words: [
    "group-data-[fit=default-short]/data-table-pagination:@max-[23.125rem]/data-table-pagination:hidden",
    "group-data-[fit=default-mid]/data-table-pagination:@max-[25.25rem]/data-table-pagination:hidden",
    "group-data-[fit=default-long]/data-table-pagination:@max-[29.25rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-short]/data-table-pagination:@max-[20.625rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-mid]/data-table-pagination:@max-[22.5rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-long]/data-table-pagination:@max-[25.75rem]/data-table-pagination:hidden",
  ].join(" "),
  /** 5. The rows shown. */
  range: [
    "group-data-[fit=default-short]/data-table-pagination:@max-[19.625rem]/data-table-pagination:hidden",
    "group-data-[fit=default-mid]/data-table-pagination:@max-[21.75rem]/data-table-pagination:hidden",
    "group-data-[fit=default-long]/data-table-pagination:@max-[25.75rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-short]/data-table-pagination:@max-[17.625rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-mid]/data-table-pagination:@max-[19.375rem]/data-table-pagination:hidden",
    "group-data-[fit=sm-long]/data-table-pagination:@max-[22.625rem]/data-table-pagination:hidden",
  ].join(" "),
  count: [
    "hidden",
    "group-data-[fit=default-short]/data-table-pagination:@max-[23.125rem]/data-table-pagination:inline",
    "group-data-[fit=default-mid]/data-table-pagination:@max-[25.25rem]/data-table-pagination:inline",
    "group-data-[fit=default-long]/data-table-pagination:@max-[29.25rem]/data-table-pagination:inline",
    "group-data-[fit=sm-short]/data-table-pagination:@max-[20.625rem]/data-table-pagination:inline",
    "group-data-[fit=sm-mid]/data-table-pagination:@max-[22.5rem]/data-table-pagination:inline",
    "group-data-[fit=sm-long]/data-table-pagination:@max-[25.75rem]/data-table-pagination:inline",
  ].join(" "),
} as const

function DataTablePagination({
  pageSizes: ownSizes,
  className,
  ...props
}: DataTablePaginationProps) {
  const context = useDataTableContext<unknown>("DataTablePagination")
  const on = useDataTableSelector(context, (state) => state.options.pagination)
  const size = useDataTableSelector(context, (state) => state.options.size)
  const pageCount = useDataTableSelector(context, (state) =>
    Math.max(state.model.pageCount, 1)
  )
  useFeatureWarning(context, !on, "DataTablePagination", "pagination")
  if (!on) return null
  return (
    <div
      data-slot="data-table-pagination"
      data-size={size}
      data-fit={fitOf(size, pageCount)}
      className={cn(
        "group/data-table-pagination @container/data-table-pagination min-w-0 flex-1",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-x-4 whitespace-nowrap">
        <PageSize context={context} ownSizes={ownSizes} size={size} />
        <RowRange context={context} />
        <PageButtons context={context} size={size} />
      </div>
    </div>
  )
}

/** "Rows" and a `Select` of the page sizes, named "Rows per page". */
function PageSize({
  context,
  ownSizes,
  size,
}: {
  context: DataTableContextValue<unknown>
  ownSizes: ReadonlyArray<number> | undefined
  size: Size
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
    <div
      data-slot="data-table-page-size"
      data-step="page-size"
      className={cn("flex items-center gap-2", STEPS.pageSize)}
    >
      {/* The `Select`'s name is its own: this label can go. */}
      <span
        aria-hidden
        data-step="label"
        className={cn("text-muted-foreground", STEPS.label)}
      >
        {t("rows")}
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
        <SelectTrigger size={size} aria-label={t("rowsPerPage")}>
          <SelectValue className="tabular-nums">
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
 * parts after it stay where they are as it changes: "1–10" and "11–20".
 * The widest value is drawn hidden, under the text.
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
      data-step="range"
      aria-live="polite"
      aria-atomic="true"
      data-widest={t("rowRange", {
        from: format.format(total),
        to: format.format(total),
        total: format.format(total),
      })}
      className={cn(
        "justify-items-start text-muted-foreground",
        STEADY,
        STEPS.range
      )}
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

const ARROWS = {
  first: { Icon: ChevronsLeftIcon, label: "firstPage" },
  previous: { Icon: ChevronLeftIcon, label: "previousPage" },
  next: { Icon: ChevronRightIcon, label: "nextPage" },
  last: { Icon: ChevronsRightIcon, label: "lastPage" },
} as const

/** First, Previous, the page field, Next and Last, at the end. */
function PageButtons({
  context,
  size,
}: {
  context: DataTableContextValue<unknown>
  size: Size
}) {
  const t = useTranslations("dataTable")
  const page = useDataTableSelector(context, (state) => state.model.page)
  const pageCount = useDataTableSelector(context, (state) =>
    Math.max(state.model.pageCount, 1)
  )
  // Read when pressed: Previous and Next step from the page now.
  const current = () => context.store.get().model.page

  const arrow = (direction: keyof typeof ARROWS) => {
    const { Icon, label } = ARROWS[direction]
    const back = direction === "first" || direction === "previous"
    const ends = direction === "first" || direction === "last"
    return (
      <PaginationItem
        data-step={ends ? "ends" : undefined}
        className={cn(ends && STEPS.ends)}
      >
        <Button
          variant="ghost"
          size={size === "sm" ? "icon-xs" : "icon-sm"}
          data-page-button={direction}
          aria-label={t(label)}
          // Focus stays on the button that reached the first or last page.
          focusableWhenDisabled
          disabled={back ? page <= 1 : page >= pageCount}
          onClick={(event: React.MouseEvent) =>
            context.actions.setPage(
              direction === "first"
                ? 1
                : direction === "last"
                  ? pageCount
                  : current() + (back ? -1 : 1),
              direction,
              event.nativeEvent
            )
          }
        >
          <Icon aria-hidden className="rtl:rotate-180" />
        </Button>
      </PaginationItem>
    )
  }

  return (
    <Pagination
      aria-label={t("pagination")}
      className="mx-0 ms-auto w-auto justify-end"
    >
      <PaginationContent className="gap-1">
        {arrow("first")}
        {arrow("previous")}
        <PaginationItem>
          <PageField
            context={context}
            page={page}
            pageCount={pageCount}
            size={size}
          />
        </PaginationItem>
        {arrow("next")}
        {arrow("last")}
      </PaginationContent>
    </Pagination>
  )
}

/** A placeholder for the field in the words around it. */
const FIELD = "\u0000"

/**
 * "Page [3] of 5": the page field, between the locale's words, or "[3] / 5"
 * where they do not fit. It is as wide as the last page's number, so the
 * arrows after it do not move as the page changes.
 */
function PageField({
  context,
  page,
  pageCount,
  size,
}: {
  context: DataTableContextValue<unknown>
  page: number
  pageCount: number
  size: Size
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const id = React.useId()
  const count = format.format(pageCount)
  const [before = "", after = ""] = t("pageOf", {
    page: FIELD,
    pageCount: count,
  }).split(FIELD)

  // What the field shows; `latest` is what is typed, read as it settles.
  const [draft, setDraft] = React.useState<number | null>(page)
  const latest = React.useRef<number | null>(page)
  // Settled (and maybe refused by a controlled table): the page again.
  const [settled, setSettled] = React.useState(0)
  React.useEffect(() => {
    latest.current = page
    setDraft(page)
  }, [page, settled])
  // Enter clamps the page typed; losing focus refuses it.
  const clamping = React.useRef(false)

  const settle = (event: Event) => {
    const typed = latest.current
    const now = context.store.get().model.page
    const to =
      typed === null
        ? now
        : clamping.current
          ? Math.min(Math.max(Math.round(typed), 1), pageCount)
          : Number.isInteger(typed) && typed >= 1 && typed <= pageCount
            ? typed
            : now
    latest.current = to
    setDraft(to)
    setSettled((n) => n + 1)
    if (to !== now) context.actions.setPage(to, "page", event)
  }

  return (
    <div
      data-slot="data-table-page-field"
      className="flex items-center gap-1.5 px-1 text-muted-foreground"
    >
      {before.trim() && (
        <span data-step="words" className={STEPS.words}>
          {before.trim()}
        </span>
      )}
      <span
        className="inline-flex text-foreground"
        // The last page's digits (tabular), and the field's padding.
        style={{ width: `max(2.5rem, calc(${count.length}ch + 0.625rem))` }}
      >
        <NumberInput
          aria-label={t("page")}
          aria-describedby={`${id}-count`}
          size={size}
          steppers={false}
          min={1}
          max={pageCount}
          allowOutOfRange
          autoComplete="off"
          enterKeyHint="go"
          value={draft}
          className="[&_[data-slot=number-input-input]]:px-1 [&_[data-slot=number-input-input]]:text-center"
          onValueChange={(value, eventDetails) => {
            // Its own formatting as it loses focus: `settle` decides.
            if (eventDetails.reason === "input-blur") return
            latest.current = value
            setDraft(value)
            // The arrows, Home and End go to the page at once.
            if (eventDetails.reason === "keyboard" && value !== null)
              context.actions.setPage(value, "page", eventDetails.event)
          }}
          onBlur={(event) => settle(event.nativeEvent)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            // Settled as it loses focus, which also formats what was
            // typed; focus comes straight back.
            const input = event.currentTarget
            clamping.current = true
            input.blur()
            clamping.current = false
            input.focus()
          }}
        />
      </span>
      <span id={`${id}-count`} data-step="words" className={STEPS.words}>
        {after.trim()}
      </span>
      <span aria-hidden data-step="count" className={STEPS.count}>
        / {count}
      </span>
    </div>
  )
}

export { DataTablePagination }
export type { DataTablePaginationProps }
