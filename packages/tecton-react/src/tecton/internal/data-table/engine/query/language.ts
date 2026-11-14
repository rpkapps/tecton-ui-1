/**
 * What the query language knows of a table: the columns a key names, the
 * values an options or boolean column takes, and the locale's numbers and
 * dates. Kept per column model, locale and boolean labels
 * (`getQueryLanguage`), as the formatter is.
 *
 * A column's key is its id or its header, compared in `keyForm` (case,
 * accents, spaces and punctuation left out: `spuddate`, `SpudDate`,
 * `spud_date`). Ids come first, then headers, each in column order: the
 * first column a form names keeps it. The key the query writes for a
 * column is its header's form when that names it (what the user sees),
 * else its id's; a column neither names has no key, and its filter stays
 * out of the query (`applyQuery` keeps it in the view).
 *
 * An option is named by its value as it is, then by its value or its label
 * in key form (`shutin` for "Shut-in"). A boolean by `yes` / `no`,
 * `true` / `false` and the labels the boolean filter shows (`labels`).
 */
import type { ColumnModel, EngineColumn } from "../columns"
import { DEFAULT_LABELS, resolveLocale, type FormatLabels } from "../format"
import type { DataTableColumnType, DataTableOption } from "../types"
import { dateLocale, type DateLocale } from "./dates"
import { numberSymbols, type NumberSymbols } from "./numbers"
import { isKeyText, isPlainValue, keyForm, valueToken } from "./syntax"

/** A column the query can filter. */
type QueryColumn = {
  readonly id: string
  readonly header: string
  readonly type: DataTableColumnType
  /** The key the query writes for it; `null` when no key names it. */
  readonly key: string | null
  readonly column: EngineColumn<unknown>
  /** A date column's `format.timeZone`, which its days are in. */
  readonly timeZone: string | undefined
}

type QueryLanguage = {
  readonly locale: string
  readonly labels: FormatLabels
  readonly numbers: NumberSymbols
  readonly dates: DateLocale
  /** The filterable columns, in column order. */
  readonly columns: ReadonlyArray<QueryColumn>
  readonly byId: ReadonlyMap<string, QueryColumn>
  /** The filterable column `key` names, else the other column it names. */
  resolveKey: (
    key: string
  ) =>
    | { readonly column: QueryColumn }
    | { readonly unfilterable: EngineColumn<unknown> }
    | undefined
  /** The filterable column whose key is closest to `key` (a typo), if any is close. */
  closestKey: (key: string) => QueryColumn | undefined
  /** The option of an options column that `text` (unquoted) names. */
  option: (column: QueryColumn, text: string) => DataTableOption | undefined
  /** The option closest to `text` (a typo), for "did you mean". */
  closestOption: (
    column: QueryColumn,
    text: string
  ) => DataTableOption | undefined
  /** The value a boolean column's `text` names. */
  boolean: (text: string) => boolean | undefined
  /** An option value, or a boolean, as the query writes it. */
  valueToken: (column: QueryColumn, value: string | boolean) => string
}

/** The edit distance of two strings (Levenshtein). */
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const kept = row[j]
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      previous = kept
    }
  }
  return row[b.length]
}

/**
 * The candidate closest to `typed` (both in key form): one it begins, or
 * that begins it, else one within an edit or two (two from five letters).
 */
function closest<TCandidate>(
  typed: string,
  candidates: ReadonlyArray<{ form: string; value: TCandidate }>
): TCandidate | undefined {
  if (!typed) return undefined
  let best: { value: TCandidate; score: number } | undefined
  for (const { form, value } of candidates) {
    if (!form) continue
    const score =
      typed.length >= 2 && (form.startsWith(typed) || typed.startsWith(form))
        ? 0.5
        : distance(typed, form)
    if (!best || score < best.score) best = { value, score }
  }
  const limit = typed.length >= 5 ? 2 : 1
  return best && best.score <= limit ? best.value : undefined
}

const languages = new WeakMap<object, Map<string, QueryLanguage>>()

function buildLanguage<T>(
  model: ColumnModel<T>,
  locale: string,
  labels: FormatLabels
): QueryLanguage {
  const names = new Map<string, EngineColumn<T>>()
  const name = (form: string, column: EngineColumn<T>) => {
    if (form && isKeyText(form) && !names.has(form)) names.set(form, column)
  }
  // Filterable columns first, so another one cannot take their key.
  const filterable = model.leaves.filter((column) => column.filterable)
  for (const column of filterable) name(keyForm(column.id), column)
  for (const column of filterable) name(keyForm(column.header), column)
  for (const column of model.leaves) name(keyForm(column.id), column)
  for (const column of model.leaves) name(keyForm(column.header), column)

  const columns: Array<QueryColumn> = filterable.map((column) => {
    const header = keyForm(column.header)
    const id = keyForm(column.id)
    const key =
      names.get(header) === column
        ? header
        : names.get(id) === column
          ? id
          : null
    return {
      id: column.id,
      header: column.header,
      type: column.type,
      key,
      column: column as EngineColumn<unknown>,
      timeZone:
        column.type === "date"
          ? ((column.format ?? {}) as Intl.DateTimeFormatOptions).timeZone
          : undefined,
    }
  })
  const byId = new Map(columns.map((column) => [column.id, column]))
  const keyCandidates = columns.flatMap((column) =>
    [keyForm(column.id), keyForm(column.header)].map((form) => ({
      form,
      value: column,
    }))
  )

  // Options by their value, then by value and label in key form.
  const optionMaps = new Map<
    string,
    { exact: Map<string, DataTableOption>; loose: Map<string, DataTableOption> }
  >()
  const optionsOf = (column: QueryColumn) => {
    let maps = optionMaps.get(column.id)
    if (!maps) {
      const exact = new Map<string, DataTableOption>()
      const loose = new Map<string, DataTableOption>()
      for (const option of column.column.options)
        if (!exact.has(option.value)) exact.set(option.value, option)
      for (const option of column.column.options) {
        const form = keyForm(option.value)
        if (form && !loose.has(form)) loose.set(form, option)
      }
      for (const option of column.column.options) {
        const form = keyForm(option.label)
        if (form && !loose.has(form)) loose.set(form, option)
      }
      maps = { exact, loose }
      optionMaps.set(column.id, maps)
    }
    return maps
  }
  const option = (column: QueryColumn, text: string) => {
    const maps = optionsOf(column)
    return maps.exact.get(text) ?? maps.loose.get(keyForm(text))
  }

  const booleans = new Map<string, boolean>()
  for (const [word, value] of [
    [labels.yes, true],
    [labels.no, false],
    ["yes", true],
    ["no", false],
    ["true", true],
    ["false", false],
  ] as const) {
    const form = keyForm(word)
    if (form && !booleans.has(form)) booleans.set(form, value)
  }
  const boolean = (text: string) => booleans.get(keyForm(text))
  const booleanTokens = new Map<boolean, string>()
  for (const value of [true, false]) {
    const label = (value ? labels.yes : labels.no).toLocaleLowerCase(locale)
    booleanTokens.set(
      value,
      isPlainValue(label) && boolean(label) === value
        ? label
        : value
          ? "yes"
          : "no"
    )
  }

  return {
    locale,
    labels,
    numbers: numberSymbols(locale),
    dates: dateLocale(locale),
    columns,
    byId,
    resolveKey(key) {
      const column = names.get(keyForm(key))
      if (!column) return undefined
      const queryColumn = byId.get(column.id)
      return queryColumn
        ? { column: queryColumn }
        : { unfilterable: column as EngineColumn<unknown> }
    },
    closestKey: (key) => closest(keyForm(key), keyCandidates),
    option,
    closestOption: (column, text) =>
      closest(
        keyForm(text),
        column.column.options.flatMap((value) => [
          { form: keyForm(value.label), value },
          { form: keyForm(value.value), value },
        ])
      ),
    boolean,
    valueToken(column, value) {
      if (typeof value === "boolean") return booleanTokens.get(value) ?? "yes"
      // The label, in lower case, when it names the option; else its value.
      const label = column.column.options
        .find((other) => other.value === value)
        ?.label.toLocaleLowerCase(locale)
      if (label !== undefined && option(column, label)?.value === value)
        return valueToken(label)
      return valueToken(value)
    },
  }
}

/**
 * The query language of `model`'s columns in `locale` (`en-US` when left
 * out or invalid), with the boolean filter's `labels`; the same object for
 * the same arguments.
 */
function getQueryLanguage<T>(
  model: ColumnModel<T>,
  locale?: string,
  labels: FormatLabels = DEFAULT_LABELS
): QueryLanguage {
  const resolved = resolveLocale(locale)
  const key = `${resolved}|${labels.yes}|${labels.no}`
  let byKey = languages.get(model)
  if (!byKey) languages.set(model, (byKey = new Map()))
  let language = byKey.get(key)
  if (!language) {
    language = buildLanguage(model, resolved, labels)
    byKey.set(key, language)
  }
  return language
}

export { getQueryLanguage }
export type { QueryColumn, QueryLanguage }
