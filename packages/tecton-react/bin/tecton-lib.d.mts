/** Types for ./tecton-lib.mjs (the tests, the eval and agent-build import it). */

export type IndexEntry = {
  id: string
  kind: "component" | "external" | "topic"
  name: string
  import?: string
  family?: string
  summary: string
  fields: { names: string; useWhen: string; routed: string; do: string }
  notFor: Array<{ need: string; id: string }>
  related: string[]
  exports: string[]
  aliases: string[]
  tokens: number
}

export type SynonymRule = { key: string; words: string[]; targets: string[] }

export type Index = {
  package: string
  version: string
  entries: IndexEntry[]
  dir: string
  df: Map<string, number>
  synonyms: SynonymRule[]
  byKey: Map<string, string>
}

export type Weights = {
  names: number
  routed: number
  useWhen: number
  do: number
}

export type SearchResult = { entry: IndexEntry; score: number }

export type RunResult = { code: number; out: string; err: string }

export const STOPWORDS: Set<string>
export const WEIGHTS: Weights
export const HELP: string

export function stem(word: string): string
export function tokenize(text: string, options?: { camel?: boolean }): string[]
export function compileSynonyms(
  synonyms: Record<string, string[]>
): SynonymRule[]
export function loadIndex(dir?: string): Index
export function exactMatch(index: Index, query: string): string | null
export function search(
  index: Index,
  query: string,
  options?: {
    limit?: number
    weights?: Weights
    synonyms?: boolean
    names?: boolean
  }
): SearchResult[]
export function resolveId(index: Index, key: string): string | null
export function suggest(index: Index, key: string, limit?: number): string[]
export function readDoc(index: Index, id: string): string
export function renderSearch(query: string, results: SearchResult[]): string
export function run(argv: string[], index?: Index): RunResult
export function main(argv?: string[]): void
