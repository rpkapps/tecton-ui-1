"use client"

/**
 * The page parts (§4.4), for `pagination`: the rows-per-page `Select`,
 * "Page 2 of 13" (counted from `rowCount` in server mode), and the first,
 * previous, next and last page buttons. Each renders nothing, and warns
 * once in development, while `pagination` is off.
 */
import * as React from "react"
import { cn } from "cn"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
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

function usePagination(part: string) {
  const context = useDataTableContext<unknown>(part)
  const on = useDataTableSelector(context, (state) => state.options.pagination)
  useFeatureWarning(context, !on, part, "pagination")
  return { context, on }
}

/** "Rows per page" and a `Select` of the page sizes. */
function DataTablePageSize({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { context, on } = usePagination("DataTablePageSize")
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const labelId = React.useId()
  const pageSize = useDataTableSelector(
    context,
    (state) => state.model.pageSize
  )
  const pageSizes = useDataTableSelector(
    context,
    (state) => state.options.pageSizes
  )
  // A page size the list leaves out is still one to choose.
  const sizes = React.useMemo(
    () =>
      pageSizes.includes(pageSize)
        ? pageSizes
        : [...pageSizes, pageSize].sort((a, b) => a - b),
    [pageSizes, pageSize]
  )
  if (!on) return null
  return (
    <div
      data-slot="data-table-page-size"
      className={cn("flex items-center gap-2 text-sm", className)}
      {...props}
    >
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

/** "Page 2 of 13", announced as it changes. */
function DataTablePageInfo({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { context, on } = usePagination("DataTablePageInfo")
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const page = useDataTableSelector(context, (state) => state.model.page)
  const pageCount = useDataTableSelector(
    context,
    (state) => state.model.pageCount
  )
  if (!on) return null
  return (
    <span
      data-slot="data-table-page-info"
      aria-live="polite"
      aria-atomic="true"
      className={cn("text-sm tabular-nums", className)}
      {...props}
    >
      {t("pageInfo", {
        page: format.format(page),
        pageCount: format.format(pageCount),
      })}
    </span>
  )
}

function PageButton({
  context,
  to,
  reason,
  disabled,
  label,
  children,
}: {
  context: DataTableContextValue<unknown>
  to: () => number
  reason: "first" | "previous" | "next" | "last"
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={label}
      // Focus stays on the button that reached the first or last page.
      focusableWhenDisabled
      disabled={disabled}
      onClick={(event: React.MouseEvent) =>
        context.actions.setPage(to(), reason, event.nativeEvent)
      }
    >
      {children}
    </Button>
  )
}

/** First, previous, next and last page. */
function DataTablePageButtons({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { context, on } = usePagination("DataTablePageButtons")
  const t = useTranslations("dataTable")
  const page = useDataTableSelector(context, (state) => state.model.page)
  const pageCount = useDataTableSelector(
    context,
    (state) => state.model.pageCount
  )
  if (!on) return null
  const first = page <= 1
  const last = page >= pageCount
  // Read when pressed: the page a click lands on is the current one's neighbour.
  const current = () => context.store.get().model
  return (
    <div
      role="group"
      aria-label={t("pagination")}
      data-slot="data-table-page-buttons"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <PageButton
        context={context}
        to={() => 1}
        reason="first"
        disabled={first}
        label={t("firstPage")}
      >
        <ChevronsLeftIcon className="rtl:rotate-180" />
      </PageButton>
      <PageButton
        context={context}
        to={() => current().page - 1}
        reason="previous"
        disabled={first}
        label={t("previousPage")}
      >
        <ChevronLeftIcon className="rtl:rotate-180" />
      </PageButton>
      <PageButton
        context={context}
        to={() => current().page + 1}
        reason="next"
        disabled={last}
        label={t("nextPage")}
      >
        <ChevronRightIcon className="rtl:rotate-180" />
      </PageButton>
      <PageButton
        context={context}
        to={() => current().pageCount}
        reason="last"
        disabled={last}
        label={t("lastPage")}
      >
        <ChevronsRightIcon className="rtl:rotate-180" />
      </PageButton>
    </div>
  )
}

export { DataTablePageButtons, DataTablePageInfo, DataTablePageSize }
