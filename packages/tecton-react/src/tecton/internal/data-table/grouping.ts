/**
 * What the grouping menus share (`DataTableGroupBy`, a column header's
 * menu): the grouping with a column added or removed, and the
 * announcement of a new grouping, which the table does not otherwise say.
 */
import type { Translator } from "../i18n/translations"
import { announce } from "../primitives/live-announcer"
import { resolveLocale } from "./engine/index"

/** `grouping` with `column` as its last level, or without it. */
function toggleGrouping(
  grouping: ReadonlyArray<string>,
  column: string,
  grouped: boolean
): ReadonlyArray<string> {
  const without = grouping.filter((id) => id !== column)
  return grouped ? [...without, column] : without
}

/** Says the grouping a menu set: its columns in order, or that there is none. */
function announceGrouping(
  t: Translator<"dataTable">,
  grouping: ReadonlyArray<string>,
  headerOf: (column: string) => string,
  locale: string | undefined
) {
  if (grouping.length === 0) return announce(t("ungrouped"))
  const list = new Intl.ListFormat(resolveLocale(locale), {
    type: "conjunction",
  })
  announce(t("groupedBy", { columnNames: list.format(grouping.map(headerOf)) }))
}

export { announceGrouping, toggleGrouping }
