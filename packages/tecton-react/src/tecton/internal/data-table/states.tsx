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
 *   `loadMore="button"` a last row there that is "Show more"; an error
 *   loading them, in a row after the rows, with "Retry".
 *
 * The default texts are localized; `DataTableContent`'s `empty` and
 * `noResults`, and `error`'s content, replace them.
 */
import * as React from "react"
import { cn } from "cn"
import {
  ArrowDownIcon,
  CircleAlertIcon,
  InboxIcon,
  RotateCwIcon,
  SearchXIcon,
} from "lucide-react"

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

/** The look of the row after the rows: "Show more" or a load's error. */
type MoreRowProps = {
  /** Every column, which it spans. */
  columns: number
  /** The table's `size`: the row is as tall as its rows. */
  size: "default" | "sm"
  /** It is an even row of a striped table, which continues their stripes. */
  striped: boolean
}

/**
 * The rows' cell padding (top and bottom) and text, at either size
 * (`TableCell`'s): drawn by what fills the cell, so that the row is at
 * least as tall as a row of text, and its whole height is the button's.
 */
const ROW_PADDING = {
  default: "py-3 text-sm",
  sm: "py-1 text-xs",
} as const

/**
 * The part of the row in view, its content in the middle: as wide as the
 * table's scroll area shows (`MoreRowView.width`; the row's width before
 * it is measured), stuck to its start, with the cells' padding at the
 * sides. So the content stays in view as the table scrolls sideways.
 */
const IN_VIEW =
  "sticky start-0 flex w-full items-center justify-center gap-1.5 px-4"

/** The body's rows of one height (not a detail row), whose height it takes. */
const BODY_ROWS =
  ':scope > tbody[data-slot="table-body"] > tr[data-slot="table-row"]:not([data-variable-height])'
/** How many of the body's last rows are measured. */
const MEASURED_ROWS = 20

/** What `MoreRow` measures, `undefined` before layout. */
type MoreRowView = {
  /** For what fills the cell: the rows' height, less its own top border. */
  fill: { minHeight: number | undefined }
  /** For `IN_VIEW`: the width the table's scroll area shows. */
  view: { width: number | undefined }
}

/**
 * The height of the row after the rows (`cell`'s), for it to be as tall as
 * they are: a row of text is as tall as its padding makes it, but a row of
 * badges or row actions is taller. The shortest of the body's last rows
 * (one line of their content), each with its bottom border (not the last,
 * which has none), less what the row adds to what fills it (its top
 * border); none with fewer than two rows (the padding alone). And the
 * width the table's scroll area shows. Measured again as the body's size
 * (rows added, fonts loaded) or the scroll area's changes.
 */
function useMoreRowView(cell: React.RefObject<HTMLTableCellElement | null>) {
  const [height, setHeight] = React.useState<number>()
  const [width, setWidth] = React.useState<number>()
  React.useLayoutEffect(() => {
    const element = cell.current
    const table = element?.closest("table")
    const body = table?.querySelector(':scope > tbody[data-slot="table-body"]')
    const area = table?.parentElement
    if (!element || !table || !body || !area) return
    const measure = () => {
      const rows = table.querySelectorAll(BODY_ROWS)
      const end = rows.length - 1
      let shortest = Infinity
      for (let at = Math.max(0, end - MEASURED_ROWS); at < end; at++) {
        const row = rows[at].getBoundingClientRect().height
        if (row > 0 && row < shortest) shortest = row
      }
      const fill = element.firstElementChild?.getBoundingClientRect().height
      const own = element.parentElement?.getBoundingClientRect().height
      const border = fill === undefined || own === undefined ? 0 : own - fill
      setHeight(Number.isFinite(shortest) ? shortest - border : undefined)
      setWidth(area.clientWidth > 0 ? area.clientWidth : undefined)
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    observer.observe(area)
    return () => observer.disconnect()
  }, [cell])
  return React.useMemo<MoreRowView>(
    () => ({ fill: { minHeight: height }, view: { width } }),
    [height, width]
  )
}

/**
 * A row across every column after the rows, which looks like their last:
 * their border above it, their height (`useMoreRowView`), their stripes
 * continued. Not a row of the grid's (no row index, not in
 * `aria-rowcount`, not reached by the arrows): the keyboard stops on its
 * button by Tab, after the grid.
 */
function MoreRow({
  slot,
  columns,
  striped,
  children,
}: Omit<MoreRowProps, "size"> & {
  slot: string
  children: (view: MoreRowView) => React.ReactNode
}) {
  const cell = React.useRef<HTMLTableCellElement | null>(null)
  const view = useMoreRowView(cell)
  return (
    <tr data-slot={slot} className={cn(striped && "bg-surface-alt")}>
      {/* Its own border: the rows' last has none. No padding at either
          size: what fills it draws the rows'. Not clipping (a virtualized
          table clips its cells): the content sticks in the table's scroll
          area, not in the cell. */}
      <TableCell
        ref={cell}
        colSpan={columns}
        className="overflow-visible! border-t border-border-subtle p-0!"
      >
        {children(view)}
      </TableCell>
    </tr>
  )
}

/**
 * The error of a load of more rows (`hasMore`), in a row after the rows
 * loaded (`MoreRow`): the error in the destructive colour, and "Retry",
 * a ghost button, which fits in the row (its height overlaps the row's
 * padding). A long error wraps in the part in view.
 */
function DataTableMoreError({
  columns,
  size,
  striped,
  description,
  onRetry,
}: MoreRowProps & {
  /** In place of the default description. */
  description: React.ReactNode
  onRetry: (() => void) | undefined
}) {
  const t = useTranslations("dataTable")
  return (
    <MoreRow slot="data-table-more-error" columns={columns} striped={striped}>
      {({ fill, view }) => (
        <div
          className={cn(
            "flex items-center whitespace-normal",
            ROW_PADDING[size]
          )}
          style={fill}
        >
          <div className={IN_VIEW} style={view}>
            <div
              role="alert"
              className="flex min-w-0 items-center gap-1.5 text-destructive"
            >
              <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
              <span>{description ?? t("errorTitle")}</span>
              {onRetry && (
                <Button
                  variant="ghost"
                  size={size === "sm" ? "xs" : "sm"}
                  className={cn("ms-1", size === "sm" ? "-my-1" : "-my-1.5")}
                  onClick={onRetry}
                >
                  <RotateCwIcon data-icon="inline-start" aria-hidden />
                  {t("retry")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </MoreRow>
  )
}

/**
 * "Show more" (`loadMore="button"`): the last row (`MoreRow`), which is a
 * ghost button across it, as tall as a row and filled as a row is under
 * the pointer, its focus ring inside it. In the middle of the part in
 * view: a down arrow, "Show more" and how many rows show (of how many the
 * view matches, when the server says: `total`); its name says it all
 * ("Show more, 350 of 500 rows shown"). While a load is out it stays
 * where it is, and keeps focus, disabled and busy, a spinner and
 * "Loading…" in place of the arrow and "Show more"; the table is busy and
 * says "Loading".
 */
function DataTableShowMore({
  columns,
  size,
  striped,
  shown,
  total,
  loading,
  onShowMore,
}: MoreRowProps & {
  /** The rows loaded. */
  shown: number
  /** The rows the view matches, when known. */
  total: number | undefined
  loading: boolean
  onShowMore: () => void
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const count = format.format(shown)
  const [label, rows] =
    total === undefined
      ? [
          t("showMoreShown", { count: shown, total: count }),
          t("shownRows", { count: shown, total: count }),
        ]
      : [
          t("showMoreOfTotal", {
            count: total,
            shown: count,
            total: format.format(total),
          }),
          t("shownOf", { shown: count, total: format.format(total) }),
        ]
  return (
    <MoreRow slot="data-table-show-more" columns={columns} striped={striped}>
      {({ fill, view }) => (
        <Button
          variant="ghost"
          aria-label={label}
          aria-busy={loading || undefined}
          disabled={loading}
          // Focus stays on it while the rows load.
          focusableWhenDisabled
          onClick={onShowMore}
          className={cn(
            // The row's box: no corners, border or press offset; the ring
            // inside it, as a focused row's.
            "h-auto w-full justify-start rounded-none border-0 px-0 focus-visible:ring-inset active:not-aria-[haspopup]:translate-y-0",
            ROW_PADDING[size]
          )}
          style={fill}
        >
          <span className={IN_VIEW} style={view}>
            {loading ? <Spinner aria-hidden /> : <ArrowDownIcon aria-hidden />}
            {loading ? t("loadingMore") : t("showMore")}
            <span className="font-normal text-muted-foreground tabular-nums">
              · {rows}
            </span>
          </span>
        </Button>
      )}
    </MoreRow>
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
