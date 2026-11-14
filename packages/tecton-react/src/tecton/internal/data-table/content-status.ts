"use client"

/**
 * What `DataTableContent`'s live region says (`useContentStatus`): the
 * table loading, then the rows loaded, or "No results"; how many rows
 * live data added, how many "Show more" brought, and how many match once
 * the search or filters change. Nothing on the first render: a table that
 * is there from the start is not announced.
 */
import * as React from "react"

import { useTranslations } from "../i18n/translations"
import { useNumberFormat } from "./context"
import type { DataTableRowModel } from "./engine/index"
import type { LiveMessage } from "./live-bridge"

/** How long after the last change of the search or filters their result is said (client mode). */
const RESULTS_DELAY = 500

/**
 * The number of rows to say match, once the search or filters have changed
 * (`matchKey`); `null` before. In client mode it is said once the user
 * pauses (`RESULTS_DELAY` after the last change), not on every key; in
 * server mode once the server's rows for the change are there (new items
 * or `rowCount`, or a load ending), never the count of the rows before.
 */
function useResults({
  matchKey,
  server,
  rowCount,
  items,
  loading,
}: {
  matchKey: string
  server: boolean
  rowCount: number
  items: ReadonlyArray<unknown>
  loading: boolean
}) {
  const [results, setResults] = React.useState<number | null>(null)
  const lastKey = React.useRef(matchKey)
  // A change of the search or filters not said yet: nothing before the
  // first, and nothing again as the rows change after it was said.
  const awaiting = React.useRef(false)
  React.useEffect(() => {
    if (lastKey.current !== matchKey) awaiting.current = true
    lastKey.current = matchKey
    if (server || !awaiting.current) return
    const timer = setTimeout(() => {
      awaiting.current = false
      setResults(rowCount)
    }, RESULTS_DELAY)
    return () => clearTimeout(timer)
  }, [matchKey, server, rowCount])
  React.useEffect(() => {
    if (!server || !awaiting.current || loading) return
    awaiting.current = false
    setResults(rowCount)
  }, [server, items, rowCount, loading])
  return results
}

/**
 * What the table's live region says: "Loading" while it loads, then the
 * rows loaded, or "No results" when nothing matches, how many rows live
 * data added (`liveAdded`), and how many rows match after the search or
 * filters change (`results`). Nothing on the first render: a table that
 * is there from the start is not announced.
 */
function useStatus({
  failed,
  loading,
  rows,
  rowCount,
  noResults,
  results,
  added,
  liveAdded,
}: {
  /** The error state says it, as an alert. */
  failed: boolean
  loading: boolean
  rows: number
  rowCount: number
  noResults: boolean
  /** The rows matching the search and filters, to say; `null` for none. */
  results: number | null
  /** The rows "Show more" brought, to say; `null` for none. */
  added: number | null
  /** The rows live data added since it last said so; `null` for none. */
  liveAdded: number | null
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const [loaded, setLoaded] = React.useState(false)
  const wasLoading = React.useRef(loading)
  React.useEffect(() => {
    if (wasLoading.current && !loading) setLoaded(true)
    wasLoading.current = loading
  }, [loading])
  if (failed) return ""
  if (loading) return t("loading")
  if (noResults) return t("noResultsTitle")
  if (liveAdded !== null)
    return t("rowsAdded", { count: liveAdded, total: format.format(liveAdded) })
  if (added !== null)
    return t("moreRowsLoaded", { count: added, total: format.format(added) })
  if (results !== null)
    return t("resultsCount", {
      count: results,
      total: format.format(results),
    })
  if (!loaded) return ""
  return rows === 0
    ? t("emptyTitle")
    : t("rowsLoaded", { count: rowCount, total: format.format(rowCount) })
}

/**
 * The live region's text, and its key: a new text for each batch "Show
 * more" or live data brought, read even when it says the same. What came
 * last is said: a search, a load or "Show more" after rows were added
 * replaces their message.
 */
function useContentStatus({
  matchKey,
  server,
  model,
  loading,
  failed,
  searching,
  rows,
  added,
  live,
}: {
  /** What the rows match, as a key: a change makes the status count them. */
  matchKey: string
  server: boolean
  model: DataTableRowModel<unknown>
  loading: boolean
  failed: boolean
  searching: boolean
  /** The body's rows. */
  rows: number
  /** What "Show more" brought last (`useShowMore`). */
  added: { count: number; key: number } | null
  /** Live data is on. */
  live: boolean
}) {
  const [liveMessage, setLiveMessage] = React.useState<LiveMessage | null>(null)
  const results = useResults({
    matchKey,
    server,
    rowCount: model.rowCount,
    items: model.allItems(),
    loading,
  })
  const text = useStatus({
    failed,
    loading,
    rows,
    rowCount: model.rowCount,
    noResults: !failed && !loading && searching && rows === 0,
    results: failed ? null : results,
    added: failed ? null : (added?.count ?? null),
    liveAdded: failed || !live ? null : (liveMessage?.count ?? null),
  })
  React.useEffect(() => {
    setLiveMessage(null)
  }, [matchKey, loading, added])
  const key =
    live && liveMessage ? `live-${liveMessage.key}` : (added?.key ?? 0)
  return { text, key, setLiveMessage }
}

export { useContentStatus }
