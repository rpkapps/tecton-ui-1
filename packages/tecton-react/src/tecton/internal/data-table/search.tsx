"use client"

/**
 * `DataTableSearch`: a search field bound to the view's `search` (§5.4),
 * with `filterable` on. The table matches the rows where any shown,
 * filterable column's display text contains it, ignoring case and accents
 * (options by their label, numbers and dates as formatted); in a tree, a
 * match's ancestors show, opened. In server mode the table reports it
 * through `onViewChange` instead.
 *
 * The field shows each key at once; the search reaches the view
 * `searchDelay` ms after the last one (the root's: 300 in server mode, 0
 * in client mode), and Enter sends it at once. Escape, or the clear
 * button, empties it (Escape on an empty field is left to what is around
 * it, a dialog that closes). Only this part renders as the user types: the
 * rows render when the search reaches the view, and only those that change.
 *
 * With `syntax="query"` the field is a power search: the view's filters and
 * search written as a query (`status:drilling td:>3000 gullfaks`), whose
 * terms set the same filters the filter buttons do, with colours,
 * suggestions and help. Its query layer loads on demand (`lazy.ts`, the
 * `query` feature: `query-search.tsx`), in idle time or as the field is
 * pointed at or focused; until then this plain field stands in its place,
 * the same size, and what is typed in it is kept and read once it loads. A
 * table with the plain search never loads it.
 */
import * as React from "react"
import { cn } from "cn"
import { CircleHelpIcon, SearchIcon, XIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@tecton/react/input-group"

import { useTranslations } from "../i18n/translations"
import {
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
} from "./context"
import { useDelayedCommit } from "./delayed-commit"
import { setSearch } from "./engine/index"
import { feature, useFeature, usePrefetchFeatures } from "./lazy"
import type { QueryHandoff } from "./query-search"
import { DataTableToolbarSearch } from "./toolbar"

type DataTableSearchProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  /**
   * `"text"`: the search, matched as text. `"query"`: a power search,
   * whose typed terms (`status:drilling td:>3000`) set the columns' filters,
   * with suggestions and help.
   */
  syntax?: "text" | "query"
}

function DataTableSearch({ syntax = "text", ...props }: DataTableSearchProps) {
  return syntax === "query" ? (
    <QuerySearchField {...props} />
  ) : (
    <TextSearch {...props} />
  )
}

function TextSearch({
  className,
  placeholder,
  "aria-label": ariaLabel,
  onKeyDown,
  ...props
}: Omit<DataTableSearchProps, "syntax">) {
  const t = useTranslations("dataTable")
  const context = useDataTableContext<unknown>("DataTableSearch")
  const { actions } = context
  const filterable = useDataTableSelector(
    context,
    (state) => state.options.filterable
  )
  const delay = useDataTableSelector(
    context,
    (state) => state.options.searchDelay
  )
  const search = useDataTableSelector(context, (state) => state.view.search)
  const clears = useDataTableSelector(context, (state) => state.clears)
  useFeatureWarning(context, !filterable, "DataTableSearch", "`filterable`")
  const { draft, change, flush } = useDelayedCommit({
    value: search,
    commit: (next) =>
      actions.updateView((view) => setSearch(view, next), "search") ||
      actions.currentView().search === next,
    delay,
    clears,
  })
  const input = React.useRef<HTMLInputElement | null>(null)
  if (!filterable) return null

  const label = ariaLabel ?? t("search")
  return (
    <DataTableToolbarSearch label={label}>
      <InputGroup
        data-slot="data-table-search"
        className={cn("w-full sm:w-64", className)}
      >
        <InputGroupAddon>
          <SearchIcon aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          ref={input}
          type="search"
          // The browser's own clear button: this part draws its own.
          className="[&::-webkit-search-cancel-button]:appearance-none"
          placeholder={placeholder ?? t("search")}
          aria-label={label}
          value={draft}
          onChange={(event) => change(event.currentTarget.value)}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented) return
            if (event.key === "Enter") flush()
            else if (event.key === "Escape" && draft !== "") {
              event.preventDefault()
              event.stopPropagation()
              change("")
            }
          }}
          {...props}
        />
        {draft !== "" && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={t("clearSearch")}
              onClick={() => {
                change("")
                input.current?.focus()
              }}
            >
              <XIcon aria-hidden />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </DataTableToolbarSearch>
  )
}

/**
 * `syntax="query"`: the query language, its colours, suggestions and
 * help (its strings are the `dataTableQuery` namespace), on demand.
 */
const QUERY = feature(() => import("./query-search"))
const PREFETCH_QUERY = [QUERY]
const NO_FEATURES = [] as const

/**
 * `syntax="query"`: the plain field until the query layer has loaded (the
 * same size and parts, its "?" too), then the query field, handed what was
 * typed, the selection and focus.
 */
function QuerySearchField({
  className,
  placeholder,
  "aria-label": ariaLabel,
  onKeyDown,
  ...props
}: Omit<DataTableSearchProps, "syntax">) {
  const t = useTranslations("dataTable")
  const context = useDataTableContext<unknown>("DataTableSearch")
  const filterable = useDataTableSelector(
    context,
    (state) => state.options.filterable
  )
  const search = useDataTableSelector(context, (state) => state.view.search)
  useFeatureWarning(context, !filterable, "DataTableSearch", "`filterable`")
  usePrefetchFeatures(filterable ? PREFETCH_QUERY : NO_FEATURES)
  const { module, load } = useFeature(QUERY, filterable)
  const handoff = React.useRef<QueryHandoff>({
    text: null,
    selectionStart: null,
    selectionEnd: null,
    focused: false,
    help: false,
  })
  const [typed, setTyped] = React.useState<string | null>(null)
  const root = React.useRef<HTMLDivElement>(null)
  // Focused as it hydrates: pressed before the page's script ran, so no
  // focus event reached it. The handoff takes it as focused, as on focus.
  React.useEffect(() => {
    const input = root.current?.ownerDocument.activeElement
    if (!(input instanceof HTMLInputElement) || !root.current?.contains(input))
      return
    handoff.current = {
      ...handoff.current,
      selectionStart: input.selectionStart,
      selectionEnd: input.selectionEnd,
      focused: true,
    }
    load()
  }, [load])
  if (!filterable) return null

  const label = ariaLabel ?? t("search")
  if (module)
    return (
      <DataTableToolbarSearch label={label} wide>
        <module.QuerySearch
          {...props}
          className={className}
          placeholder={placeholder}
          label={label}
          onKeyDown={onKeyDown}
          handoff={handoff.current}
        />
      </DataTableToolbarSearch>
    )
  const keep = (input: HTMLInputElement, focused: boolean) => {
    handoff.current = {
      ...handoff.current,
      selectionStart: input.selectionStart,
      selectionEnd: input.selectionEnd,
      focused,
    }
  }
  return (
    <DataTableToolbarSearch label={label} wide>
      <div
        ref={root}
        data-slot="data-table-search"
        data-syntax="query"
        className={cn("w-full sm:w-[28rem]", className)}
        onPointerEnter={load}
      >
        <InputGroup className="w-full">
          <div className="relative flex min-w-0 flex-1 self-stretch">
            <InputGroupInput
              className="h-full w-full ps-1.5 pe-1.5"
              {...props}
              placeholder={placeholder ?? t("searchOrFilter")}
              aria-label={label}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              value={typed ?? search}
              onChange={(event) => {
                const text = event.currentTarget.value
                handoff.current = { ...handoff.current, text }
                keep(event.currentTarget, true)
                setTyped(text)
              }}
              // The caret moved: by a key, a press, a selection.
              onSelect={(event) => keep(event.currentTarget, true)}
              onKeyUp={(event) => keep(event.currentTarget, true)}
              onMouseUp={(event) => keep(event.currentTarget, true)}
              onFocus={(event) => {
                keep(event.currentTarget, true)
                load()
              }}
              onBlur={(event) => keep(event.currentTarget, false)}
              onKeyDown={onKeyDown}
            />
          </div>
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          {/* The combobox's own addon, empty in the query field (it shows
              no trigger): the same parts, so the same size. */}
          <InputGroupAddon align="inline-end" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={t("searchSyntax")}
              data-slot="data-table-query-help"
              onClick={() => {
                handoff.current = { ...handoff.current, help: true }
                load()
              }}
            >
              <CircleHelpIcon aria-hidden />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </DataTableToolbarSearch>
  )
}

export { DataTableSearch, QUERY }
export type { DataTableSearchProps }
