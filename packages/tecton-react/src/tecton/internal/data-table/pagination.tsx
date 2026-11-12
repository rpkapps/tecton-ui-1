"use client"

/**
 * `DataTablePagination` (§4.4), for `pagination`: in one row, the
 * rows-per-page `Select`, the rows shown ("1–10 of 240", announced as it
 * changes) and Tecton's `Pagination` with the page buttons: previous, the
 * pages (the first, the last, the current one and its neighbours, an
 * ellipsis for the others) and next. The pages are buttons, not links: the
 * `Button` that `PaginationLink`'s look is (ghost, the current page
 * outline), in `PaginationItem`s. The rows are the server's `rowCount` in
 * server mode. It renders nothing, and warns once in development, while
 * `pagination` is off.
 */
import * as React from "react"
import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@tecton/react/components/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

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
 * The pages to show a button for, and `null` for an ellipsis: every page
 * up to 7, else the first, the last, the current one and its neighbours
 * (five in a row at either end), so the row keeps its length as the page
 * changes.
 */
function pagesToShow(page: number, pageCount: number): Array<number | null> {
  if (pageCount <= 7)
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, null, pageCount]
  if (page >= pageCount - 3)
    return [
      1,
      null,
      pageCount - 4,
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ]
  return [1, null, page - 1, page, page + 1, null, pageCount]
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
        "flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm",
        className
      )}
      {...props}
    >
      <PageSize context={context} ownSizes={ownSizes} />
      <RowRange context={context} />
      <PageButtons context={context} />
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
  const labelId = React.useId()
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
      <span id={labelId}>{t("rowsPerPage")}</span>
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
        <SelectTrigger size="sm" className="w-18" aria-labelledby={labelId}>
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
      className="text-muted-foreground tabular-nums"
    >
      {t("rowRange", {
        from: format.format(from),
        to: format.format(to),
        total: format.format(total),
      })}
    </span>
  )
}

/** Previous, the pages and next: `Pagination`'s parts, as buttons. */
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
  return (
    <Pagination
      aria-label={t("pagination")}
      className="mx-0 w-auto justify-end"
    >
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="ghost"
            className="ps-2!"
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
            <span className="hidden sm:block">{t("previous")}</span>
          </Button>
        </PaginationItem>
        {pagesToShow(page, pageCount).map((to, index) =>
          to === null ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={to}>
              <Button
                variant={to === page ? "outline" : "ghost"}
                size="icon"
                aria-current={to === page ? "page" : undefined}
                aria-label={t("goToPage", { page: format.format(to) })}
                className="tabular-nums"
                onClick={(event: React.MouseEvent) =>
                  context.actions.setPage(to, "page", event.nativeEvent)
                }
              >
                {format.format(to)}
              </Button>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <Button
            variant="ghost"
            className="pe-2!"
            aria-label={t("nextPage")}
            // Focus stays on the button that reached the last page.
            focusableWhenDisabled
            disabled={page >= pageCount}
            onClick={(event: React.MouseEvent) =>
              context.actions.setPage(current() + 1, "next", event.nativeEvent)
            }
          >
            <span className="hidden sm:block">{t("next")}</span>
            <ChevronRightIcon
              data-icon="inline-end"
              className="rtl:rotate-180"
            />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export { DataTablePagination }
export type { DataTablePaginationProps }
