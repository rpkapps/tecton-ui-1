"use client"

/**
 * The table's states (§6), drawn with Tecton's own components:
 *
 * - empty (no rows at all), no results (none match the search and
 *   filters: "Clear filters"), error (`error`: "Retry" with `onRetry`), each
 *   an `Empty` in the body's one row, under the header;
 * - first load: Skeleton rows, as many as a page (5 without pages);
 * - refreshing with rows: a thin indeterminate bar under the header, the
 *   rows staying where they are.
 *
 * The default texts are localized; `DataTableContent`'s `empty` and
 * `noResults`, and `error`'s content, replace them.
 */
import * as React from "react"
import { cn } from "cn"
import { CircleAlertIcon, InboxIcon, SearchXIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"
import { Skeleton } from "@tecton/react/components/skeleton"
import { TableCell } from "@tecton/react/components/table"

import { useTranslations } from "../i18n/translations"
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
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
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
 * The rows shown while the first rows load: plain rows, not the grid's (so
 * the keyboard does not stop on them), hidden from screen readers, which
 * hear the table busy and "Loading".
 */
function loadingRows<T>(
  count: number,
  columns: ReadonlyArray<EngineColumn<T>>,
  selection: boolean
) {
  return Array.from({ length: count }, (_, index) => (
    <tr
      key={index}
      aria-hidden
      data-slot="data-table-loading-row"
      className="border-b border-border-subtle"
    >
      {selection && <TableCell className="w-px" />}
      {columns.map((column) => (
        <TableCell key={column.id}>
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
 * An indeterminate bar `top` px down the frame (the header's height): a
 * highlight sweeping along the track, or a still bar with reduced motion.
 * Not `Progress`: its indicator takes its width from the value, so with no
 * value it has none, and its parts take no class to draw one.
 */
function DataTableProgress({ top }: { top: number }) {
  const t = useTranslations("dataTable")
  return (
    <div
      role="progressbar"
      aria-label={t("loading")}
      data-slot="data-table-progress"
      className="pointer-events-none absolute inset-x-0 z-20 h-0.5 overflow-hidden bg-progress-track"
      style={{ top }}
    >
      <div className="size-full bg-linear-to-r from-transparent via-progress to-transparent bg-size-[200%_100%] bg-no-repeat motion-safe:animate-[tw-shimmer_1.5s_linear_infinite] motion-reduce:bg-progress motion-reduce:bg-none rtl:[animation-direction:reverse]" />
    </div>
  )
}

export {
  DataTableEmptyState,
  DataTableErrorState,
  DataTableNoResultsState,
  DataTableProgress,
  loadingRows,
}
