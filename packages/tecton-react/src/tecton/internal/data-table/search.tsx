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
 */
import * as React from "react"
import { cn } from "cn"
import { SearchIcon, XIcon } from "lucide-react"

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
import { DataTableToolbarSearch } from "./toolbar"

type DataTableSearchProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
>

function DataTableSearch({
  className,
  placeholder,
  "aria-label": ariaLabel,
  onKeyDown,
  ...props
}: DataTableSearchProps) {
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

export { DataTableSearch }
export type { DataTableSearchProps }
