/**
 * A filter value's list (`DataTableFilterValue`), for every module that
 * reads or writes one by type: `values` for text, options and yes / no,
 * `ranges` for numbers and dates. What each module does with an item of
 * it (clean, compare, match, count, word it) is that module's own table.
 */
import type { DataTableFilterValue } from "./types"

/** A filter value with a list: every type but `custom`. */
type ListFilterValue = Exclude<DataTableFilterValue, { type: "custom" }>

type ListFilterType = ListFilterValue["type"]

/** The list's item, by the filter's type. */
type ListItem<TType extends ListFilterType> =
  Extract<ListFilterValue, { type: TType }> extends infer TValue
    ? TValue extends { values: ReadonlyArray<infer TItem> }
      ? TItem
      : TValue extends { ranges: ReadonlyArray<infer TItem> }
        ? TItem
        : never
    : never

/** Where each type keeps its list. */
const LIST_KEYS = {
  text: "values",
  options: "values",
  boolean: "values",
  number: "ranges",
  date: "ranges",
} as const

/** The items of a filter's list. */
function listOf<TValue extends ListFilterValue>(
  value: TValue
): ReadonlyArray<ListItem<TValue["type"]>> {
  return (value as unknown as Record<string, ReadonlyArray<never>>)[
    LIST_KEYS[value.type]
  ]
}

/**
 * The filter of `type` with `list` and, with `empty`, its "No value"; `null`
 * when it filters nothing (an empty list without "No value").
 */
function listFilter<TType extends ListFilterType>(
  type: TType,
  list: ReadonlyArray<ListItem<TType>>,
  empty: boolean
): Extract<ListFilterValue, { type: TType }> | null {
  if (!list.length && !empty) return null
  return {
    type,
    [LIST_KEYS[type]]: list,
    ...(empty ? { empty } : {}),
  } as unknown as Extract<ListFilterValue, { type: TType }>
}

export { listFilter, listOf, LIST_KEYS }
export type { ListFilterType, ListFilterValue, ListItem }
