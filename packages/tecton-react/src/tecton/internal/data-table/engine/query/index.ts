/**
 * Internal to `@tecton/react`: DataTable's query language, the typed
 * search of `DataTableSearch syntax="query"`. Plain TypeScript, no React
 * and no DOM. A query is the view's own filters and search written as
 * text (`status:drilling td:>=3000 gullfaks`): typing one sets the filters
 * the filter buttons set, and a view's filters write back as one.
 *
 * - `language`: what a table's columns are called and take
 *   (`getQueryLanguage`, kept per column model, locale and labels).
 * - `parse`: `parseQuery`, the terms, filters, search, spans to draw and
 *   problems (with codes and parameters, for localized messages);
 *   `merge`, a column's two terms as one filter.
 * - `serialize`: `serializeQuery`, a view's filters and search as canonical
 *   query text that parses back as the same; `applyQuery`, a parsed query
 *   onto a view.
 * - `source`: the rows the suggestions count, through the engine's
 *   filtering; `suggest`: `suggestQuery`, what to offer at the caret.
 * - `syntax`, `numbers`, `dates`: the text below the meaning.
 *
 * Left out of the engine's index, so the field can load it on demand as a
 * chunk of its own.
 */
export { getQueryLanguage } from "./language"
export type { QueryColumn, QueryLanguage } from "./language"
export { parseQuery, readDateItem } from "./parse"
export type { DateItem, ParseOptions } from "./parse"
export { applyQuery, serializeQuery } from "./serialize"
export type { SerializeOptions } from "./serialize"
export { createQuerySource, querySourceOf } from "./source"
export type {
  QuerySource,
  QuerySourceOptions,
  QuerySourceParts,
  TextMatch,
} from "./source"
export { suggestQuery } from "./suggest"
export type {
  DayRange,
  QuerySuggestion,
  QuerySuggestions,
  SuggestOptions,
} from "./suggest"
export type * from "./types"
