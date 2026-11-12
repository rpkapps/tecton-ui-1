"use client"

/**
 * The table's states (§6), drawn with Tecton's own components:
 *
 * - empty (no rows at all), no results (none match the search and
 *   filters: "Clear filters"), error (`error`: "Retry" with `onRetry`), each
 *   an `Empty` in the body's one row, under the header;
 * - first load: Skeleton rows, as many as a page (5 without pages);
 * - refreshing with rows: a thin indeterminate bar under the header, the
 *   rows staying where they are;
 * - more rows to come (`hasMore`): loading rows after the last row, or with
 *   `loadMore="button"` a band there with "Show more"; an error loading
 *   them, after the rows, with "Retry".
 *
 * The default texts are localized; `DataTableContent`'s `empty` and
 * `noResults`, and `error`'s content, replace them.
 */
import * as React from "react"
import { cn } from "cn"
import { CircleAlertIcon, InboxIcon, SearchXIcon } from "lucide-react"

import { Alert, AlertAction, AlertTitle } from "@tecton/react/alert"
import { Button } from "@tecton/react/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/empty"
import { Progress } from "@tecton/react/progress"
import { Skeleton } from "@tecton/react/skeleton"
import { Spinner } from "@tecton/react/spinner"
import { TableCell } from "@tecton/react/table"

import { useTranslations } from "../i18n/translations"
import { useNumberFormat } from "./context"
import {
  cellBorderClassName,
  pinnedCellClassName,
  pinEdgeClassName,
  pinnedRowClassName,
  pinStyle,
  type CellPin,
  type RowShared,
} from "./cell"
import type { EngineColumn } from "./engine/index"

function State({
  icon,
  title,
  description,
  action,
  role,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  action?: React.ReactNode
  role?: "alert"
}) {
  return (
    <Empty data-slot="data-table-state" role={role}>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          // An error's icon on a translucent destructive tint, as the
          // table's outlined status badges (an outline destructive Badge).
          className={
            role === "alert" ? "bg-destructive/10 text-destructive" : undefined
          }
        >
          {icon}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

function DataTableEmptyState() {
  const t = useTranslations("dataTable")
  return (
    <State
      icon={<InboxIcon />}
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    />
  )
}

function DataTableNoResultsState({
  onClearFilters,
}: {
  onClearFilters: () => void
}) {
  const t = useTranslations("dataTable")
  return (
    <State
      icon={<SearchXIcon />}
      title={t("noResultsTitle")}
      description={t("noResultsDescription")}
      action={
        <Button variant="outline" onClick={onClearFilters}>
          {t("clearFilters")}
        </Button>
      }
    />
  )
}

function DataTableErrorState({
  description,
  onRetry,
}: {
  /** In place of the default description. */
  description: React.ReactNode
  onRetry: (() => void) | undefined
}) {
  const t = useTranslations("dataTable")
  return (
    <State
      role="alert"
      icon={<CircleAlertIcon />}
      title={t("errorTitle")}
      description={description ?? t("errorDescription")}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        )
      }
    />
  )
}

/**
 * The error of a load of more rows (`hasMore`), after the rows loaded: a
 * row across every column, a destructive `Alert` with "Retry". Not a row of the grid's:
 * the keyboard stops on its button by Tab.
 */
function DataTableMoreError({
  columns,
  description,
  onRetry,
}: {
  columns: number
  /** In place of the default description. */
  description: React.ReactNode
  onRetry: (() => void) | undefined
}) {
  const t = useTranslations("dataTable")
  return (
    <tr data-slot="data-table-more-error">
      <TableCell colSpan={columns}>
        <Alert variant="destructive" className="whitespace-normal">
          <CircleAlertIcon aria-hidden />
          <AlertTitle>{description ?? t("errorTitle")}</AlertTitle>
          {onRetry && (
            <AlertAction>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {t("retry")}
              </Button>
            </AlertAction>
          )}
        </Alert>
      </TableCell>
    </tr>
  )
}

/**
 * "Show more" after the last row (`loadMore="button"`): a band across every
 * column on the footer's fill, as tall as the footer, with how many rows
 * show (of how many the view matches, when the server says: `total`) and
 * the button, at the band's end, kept in view at the end of a table
 * scrolled sideways. Not a row of the grid's: the keyboard stops on its
 * button by Tab. While a load is out the button stays where it is, and
 * keeps focus, disabled with a spinner; the table is busy and says
 * "Loading".
 */
function DataTableShowMore({
  columns,
  shown,
  total,
  loading,
  onShowMore,
}: {
  columns: number
  /** The rows loaded. */
  shown: number
  /** The rows the view matches, when known. */
  total: number | undefined
  loading: boolean
  onShowMore: () => void
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  return (
    <tr
      data-slot="data-table-show-more"
      className="border-t border-border-subtle bg-muted"
    >
      {/* Not clipping (a virtualized table clips its cells): the content
          sticks to the end of the table's scroll area, not of the cell. */}
      <TableCell
        colSpan={columns}
        className="h-12 overflow-visible! px-3 py-1.5"
      >
        <div className="sticky end-3 ms-auto flex w-max items-center gap-x-6">
          <span className="text-muted-foreground tabular-nums">
            {total === undefined
              ? t("rowsLoaded", { count: shown, total: format.format(shown) })
              : t("shownOfTotal", {
                  count: shown,
                  shown: format.format(shown),
                  total: format.format(total),
                })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            // Focus stays on it while the rows load.
            focusableWhenDisabled
            onClick={onShowMore}
          >
            {loading && <Spinner data-icon="inline-start" aria-hidden />}
            {t("showMore")}
          </Button>
        </div>
      </TableCell>
    </tr>
  )
}

/**
 * The rows shown while the first rows load, and after the last row while
 * more come (`hasMore`): plain rows, not the grid's (so the keyboard does
 * not stop on them), hidden from screen readers, which hear the table busy
 * and "Loading". Their pinned cells stick like the other rows'.
 */
function loadingRows<T>(
  count: number,
  columns: ReadonlyArray<EngineColumn<T>>,
  shared: Pick<
    RowShared<T>,
    "selection" | "handle" | "pinned" | "pins" | "selectionPin" | "handlePin"
  >
) {
  const cell = (pin: CellPin | undefined, className?: string) => ({
    className: cn(
      className,
      shared.pinned && cellBorderClassName,
      pin && pinnedCellClassName,
      pinEdgeClassName(pin)
    ),
    style: pin && pinStyle(pin),
  })
  return Array.from({ length: count }, (_, index) => (
    <tr
      key={index}
      aria-hidden
      data-slot="data-table-loading-row"
      className={cn(
        "border-b border-border-subtle",
        shared.pinned && pinnedRowClassName
      )}
    >
      {shared.handle && <TableCell {...cell(shared.handlePin, "w-px")} />}
      {shared.selection && <TableCell {...cell(shared.selectionPin, "w-px")} />}
      {columns.map((column, at) => (
        <TableCell key={column.id} {...cell(shared.pins[at])}>
          {/* One line of the cell's text tall (`1lh`): the row is as tall
              as a row of text, at either size. */}
          <Skeleton
            className={cn(
              "h-lh w-full max-w-32",
              column.align === "end" && "ms-auto"
            )}
          />
        </TableCell>
      ))}
    </tr>
  ))
}

/**
 * An indeterminate `Progress` (`value={null}`) `top` px down the frame (the
 * header's height), named "Loading": a segment sweeping across the track,
 * or a pulsing bar with reduced motion.
 */
function DataTableProgress({ top }: { top: number }) {
  const t = useTranslations("dataTable")
  return (
    <Progress
      value={null}
      aria-label={t("loading")}
      data-slot="data-table-progress"
      className="pointer-events-none absolute inset-x-0 z-20"
      style={{ top }}
    />
  )
}

export {
  DataTableEmptyState,
  DataTableErrorState,
  DataTableMoreError,
  DataTableNoResultsState,
  DataTableProgress,
  DataTableShowMore,
  loadingRows,
}
