/**
 * The types of the query language: what `parseQuery` reads in a query,
 * what it finds wrong, and what `suggestQuery` offers. Plain data; the
 * diagnostics hold codes and parameters, not words, for the parts to put
 * in the user's language.
 */
import type { DataTableFilterValue, DataTableView } from "../types"

/** What a stretch of the query is, for drawing it. */
type QuerySpanKind =
  /** A column's key, before its colon. */
  | "key"
  | "colon"
  /** `>`, `>=`, `<`, `<=`, `=` and a range's `..`. */
  | "operator"
  | "value"
  /** A comma between values. */
  | "separator"
  /** `none` / `empty`: the filter's "No value". */
  | "empty"
  /** A relative date preset (`last30d`). */
  | "preset"
  /** Free words or a quoted phrase: the search. */
  | "text"
  /** `AND`, and the `OR`, `NOT` and `-` the query does not take. */
  | "keyword"

type QuerySpan = {
  readonly start: number
  readonly end: number
  readonly kind: QuerySpanKind
}

type QueryDiagnosticCode =
  /** No column has this key (`key`; `suggestion`: the closest column's id). */
  | "unknownColumn"
  /** The key names a column that cannot be filtered (`column`). */
  | "columnNotFilterable"
  /** No option or yes / no is called `value` (`suggestion`: the closest option's value). */
  | "unknownValue"
  /** `value` is not a number in the table's locale. */
  | "notANumber"
  /** `value` is not a date. */
  | "badDate"
  /** `value` could be more than one date (`reason`: `noYear`, `twoDigitYear`, `month`). */
  | "ambiguousDate"
  /** A range whose start (`from`) is after its end (`to`). */
  | "backwardsRange"
  /**
   * `OR`, `NOT` or a leading `-` (`operator`): filters cannot say "either"
   * or "not", so the term is not applied.
   */
  | "unsupportedOperator"
  /**
   * `>` or `<` (`operator`) on a date and time (an instant): the date
   * filter includes its ends.
   */
  | "exclusiveComparison"
  /** A comparison or a range (`operator`) on a column that has no order. */
  | "notComparable"
  /**
   * The column is filtered earlier in the query and this term cannot be
   * combined with that (`reason`: `noMatch`, nothing matches both;
   * `notCombinable`, one filter cannot say both).
   */
  | "duplicateColumn"

type QueryDiagnosticParams = {
  /** The column's id. */
  readonly column?: string
  /** The key as typed. */
  readonly key?: string
  /** The value as typed (unquoted). */
  readonly value?: string
  /** A column id (`unknownColumn`) or option value (`unknownValue`) to offer instead. */
  readonly suggestion?: string
  readonly operator?: string
  readonly reason?: string
  readonly from?: string
  readonly to?: string
}

type QueryDiagnostic = {
  readonly code: QueryDiagnosticCode
  /** The stretch of the query it is about. */
  readonly start: number
  readonly end: number
  readonly params: QueryDiagnosticParams
}

type QueryTermBase = {
  readonly start: number
  readonly end: number
  /**
   * Whether the term reaches the view: not when it has a problem, is
   * incomplete (`status:` while typing) or is negated. A problem in an
   * item of a filter's list is that item's: the term applies its other
   * items (`status:legacy,producing` applies `producing`), if any.
   */
  readonly applied: boolean
}

/** Free words or a quoted phrase: part of the view's `search`. */
type QueryTextTerm = QueryTermBase & {
  readonly kind: "text"
  /** What it searches for (unquoted). */
  readonly text: string
  readonly quoted: boolean
}

/** `column:value`: a column's filter. */
type QueryFilterTerm = QueryTermBase & {
  readonly kind: "filter"
  /** The key, before the colon. */
  readonly key: {
    readonly start: number
    readonly end: number
    readonly text: string
  }
  /** The column's id; `undefined` when the key names no filterable column. */
  readonly column: string | undefined
  /** Where the value starts: just after the colon. */
  readonly valueStart: number
  /**
   * What this term alone filters (before another term on the same column
   * is combined with it), from the items of its list without a problem:
   * for a date, the days it was understood as, for the field to show while
   * typing. `undefined` when it filters nothing.
   */
  readonly value: DataTableFilterValue | undefined
  /** No value yet (`status:`, `td:>`): not a problem, nothing applied. */
  readonly incomplete: boolean
}

/** `AND` (applied: terms side by side are combined anyway), `OR`, `NOT`. */
type QueryKeywordTerm = QueryTermBase & {
  readonly kind: "keyword"
  readonly keyword: "AND" | "OR" | "NOT"
}

type QueryTerm = QueryTextTerm | QueryFilterTerm | QueryKeywordTerm

type ParsedQuery = {
  readonly text: string
  readonly terms: ReadonlyArray<QueryTerm>
  /** In order, for drawing the query; gaps are spaces. */
  readonly spans: ReadonlyArray<QuerySpan>
  /** In order of their start. */
  readonly diagnostics: ReadonlyArray<QueryDiagnostic>
  /** The applied filter terms, combined per column, by column id. */
  readonly filters: Readonly<Record<string, DataTableFilterValue>>
  /** The applied text terms, joined by a space. */
  readonly search: string
}

/** The part of a view the query writes. */
type QueryView = Pick<DataTableView, "filters" | "search">

export type {
  ParsedQuery,
  QueryDiagnostic,
  QueryDiagnosticCode,
  QueryDiagnosticParams,
  QueryFilterTerm,
  QueryKeywordTerm,
  QuerySpan,
  QuerySpanKind,
  QueryTerm,
  QueryTextTerm,
  QueryView,
}
