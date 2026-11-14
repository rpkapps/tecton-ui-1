"use client"

/**
 * A filter of choices (`DataTableFilter`'s popover): a checkbox per option
 * of an options column, or Yes and No for a yes / no one, each with its
 * number of rows (those matching the search and the other filters,
 * counted when the popover opens; in server mode an option's own `count`,
 * and none for Yes and No), then "No value", apart. None chosen is any
 * value, as Clear leaves it. The values a filter holds that the options do
 * not list (from a power search or the application) stay chosen.
 */
import * as React from "react"

import { Separator } from "@tecton/react/separator"

import { useTranslations } from "../i18n/translations"
import { useDataTableSelector } from "./context"
import { getFacets } from "./engine/facets"
import { listFilter } from "./engine/filter-lists"
import type { DataTableFilterValue } from "./engine/index"
import {
  ChoiceRow,
  NoValueChoice,
  type FilterProps,
} from "./filter-popover-parts"

type ChoiceValue = Extract<
  DataTableFilterValue,
  { type: "boolean" } | { type: "options" }
>

/** A choice's value: an option's, or yes / no. */
type Choice = string | boolean

function ChoiceFilter({
  context,
  column,
  value,
  set,
  noValue,
}: FilterProps<ChoiceValue>) {
  const t = useTranslations("dataTable")
  const server = useDataTableSelector(
    context,
    (state) => state.options.dataMode === "server"
  )
  const model = useDataTableSelector(context, (state) => state.model)
  // Counted now that the popover is open, for this view.
  const facets = React.useMemo(
    () => (server ? null : getFacets(model, column.id)),
    [column, server, model]
  )
  const type = column.type as ChoiceValue["type"]
  const choices: ReadonlyArray<{
    value: Choice
    label: string
    count?: number
  }> =
    type === "boolean"
      ? [
          { value: true, label: t("yes") },
          { value: false, label: t("no") },
        ]
      : column.options
  if (!choices.length && !noValue)
    return <p className="text-sm text-muted-foreground">{t("noOptions")}</p>
  const list: ReadonlyArray<Choice> = value?.values ?? []
  const chosen = new Set(list)
  const empty = value?.empty === true
  const update = (values: ReadonlyArray<Choice>, empty: boolean) =>
    set(listFilter(type, values as ReadonlyArray<never>, empty))
  const toggle = (choice: Choice, on: boolean) => {
    // In the choices' order, then the values chosen they do not list.
    const listed = new Set(choices.map((other) => other.value))
    update(
      [
        ...choices
          .map((other) => other.value)
          .filter((other) => (other === choice ? on : chosen.has(other))),
        ...list.filter((other) => !listed.has(other)),
      ],
      empty
    )
  }
  return (
    <div role="group" aria-label={column.header} className="flex flex-col">
      {choices.map((choice) => (
        <ChoiceRow
          key={String(choice.value)}
          label={choice.label}
          checked={chosen.has(choice.value)}
          onCheckedChange={(on) => toggle(choice.value, on)}
          count={
            facets
              ? (facets.counts.get(String(choice.value)) ?? 0)
              : choice.count
          }
          className="rounded-sm px-1"
        />
      ))}
      {noValue && (
        <>
          {choices.length > 0 && (
            // Edge to edge, through the popover's padding, as a menu's
            // separators are.
            <Separator className="-mx-4 my-1 data-horizontal:w-auto" />
          )}
          <NoValueChoice
            checked={empty}
            onCheckedChange={(on) => update(list, on)}
            count={facets?.empty}
            className="rounded-sm px-1"
          />
        </>
      )}
    </div>
  )
}

export { ChoiceFilter }
