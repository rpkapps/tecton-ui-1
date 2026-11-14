"use client"

/**
 * A text filter (`DataTableFilter`'s popover): a field, and the texts
 * added from it as chips (`Chip`s in a group of their own, each with its
 * remove button); the rows whose display text contains any of them (like
 * search). Enter or a comma adds what is typed, a comma within quotes
 * staying in the text (`"Smith, John"`, as the power search reads it);
 * Backspace in the empty field removes the last chip. What is typed
 * applies too, as a text beside the chips, `delay` ms after the last key.
 */
import * as React from "react"

import { Chip, ChipGroup, ChipList } from "@tecton/react/chip"
import { Input } from "@tecton/react/input"
import { Label } from "@tecton/react/label"

import { useTranslations } from "../i18n/translations"
import { useDelayedCommit } from "./delayed-commit"
import { listFilter } from "./engine/filter-lists"
import type { DataTableFilterValue } from "./engine/index"
import { itemsOf, unquote } from "./engine/query/syntax"
import { sameIds } from "./engine/view"
import {
  FilterFooter,
  useMatchCounts,
  type FilterProps,
} from "./filter-popover-parts"

/** A text filter being edited: its chips, what is typed, its "No value". */
type TextDraft = {
  values: ReadonlyArray<string>
  text: string
  empty: boolean
}

/** A text as typed, its quotes taken off: what it looks for. */
const textOf = (typed: string) => unquote(typed).trim()

/** The texts a draft looks for: its chips, then what is typed. */
function textsOf({ values, text }: TextDraft): ReadonlyArray<string> {
  const typed = textOf(text)
  return typed && !values.includes(typed) ? [...values, typed] : values
}

/** The filter of a text draft, or `null` when it filters nothing. */
const textFilter = (draft: TextDraft) =>
  listFilter("text", textsOf(draft), draft.empty)

/**
 * What is typed, at its commas outside quotes: the texts before the last
 * one (to add as chips) and what follows it (still being typed).
 */
function splitTyped(typed: string) {
  const items = itemsOf(typed, 0, typed.length)
  const last = items[items.length - 1]
  return {
    texts: items.slice(0, -1).map((item) => typed.slice(item.start, item.end)),
    rest: typed.slice(last.start),
  }
}

/** `draft`'s chips with `texts` added, each once and not blank. */
function withTexts(draft: TextDraft, texts: ReadonlyArray<string>) {
  const values = [...draft.values]
  for (const typed of texts) {
    const text = textOf(typed)
    if (text && !values.includes(text)) values.push(text)
  }
  return values
}

function TextFilter({
  context,
  column,
  value,
  set,
  delay,
  clears,
  noValue,
}: FilterProps<Extract<DataTableFilterValue, { type: "text" }>>) {
  const t = useTranslations("dataTable")
  const id = React.useId()
  const input = React.useRef<HTMLInputElement | null>(null)
  const matches = useMatchCounts(context, column)
  // The view's filter as a draft, made again only when the view changes:
  // the field keeps what is typed until then.
  const viewDraft = React.useMemo(
    (): TextDraft => ({
      values: value?.values ?? [],
      text: "",
      empty: value?.empty === true,
    }),
    [value]
  )
  const { draft, change, flush } = useDelayedCommit<TextDraft>({
    value: viewDraft,
    commit: (next) => set(textFilter(next)),
    delay,
    clears,
    // The texts it applies, whether a chip or typed.
    same: (a, b) => a.empty === b.empty && sameIds(textsOf(a), textsOf(b)),
  })
  /** Sets the draft and applies it now: a chip added or removed. */
  const commit = (next: TextDraft) => {
    change(next)
    flush()
  }
  const remove = (gone: ReadonlyArray<string>) => {
    const values = draft.values.filter((text) => !gone.includes(text))
    commit({ ...draft, values })
    // The last chip gone: back to the field.
    if (!values.length) input.current?.focus()
  }
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{t("filterContains")}</Label>
      <Input
        ref={input}
        id={id}
        placeholder={t("filterAddText")}
        value={draft.text}
        onChange={(event) => {
          const { texts, rest } = splitTyped(event.currentTarget.value)
          if (!texts.length) return change({ ...draft, text: rest })
          // A comma (typed or pasted) adds what is before it.
          commit({
            ...draft,
            values: withTexts(draft, texts),
            text: rest.trimStart(),
          })
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (textOf(draft.text)) {
              const { texts, rest } = splitTyped(draft.text)
              commit({
                ...draft,
                values: withTexts(draft, [...texts, rest]),
                text: "",
              })
            } else flush()
          } else if (
            event.key === "Backspace" &&
            draft.text === "" &&
            draft.values.length > 0 &&
            event.currentTarget.selectionStart === 0
          ) {
            event.preventDefault()
            commit({ ...draft, values: draft.values.slice(0, -1) })
          }
        }}
      />
      {draft.values.length > 0 && (
        <ChipGroup
          aria-label={t("filterContainsAny")}
          onRemove={remove}
          className="py-0.5"
        >
          <ChipList>
            {draft.values.map((text) => (
              <Chip key={text} value={text} label={text}>
                <span className="max-w-52 truncate">{text}</span>
              </Chip>
            ))}
          </ChipList>
        </ChipGroup>
      )}
      <FilterFooter
        noValue={noValue}
        empty={draft.empty}
        onEmptyChange={(empty) => commit({ ...draft, empty })}
        matches={matches}
        filter={textFilter(draft)}
      />
    </div>
  )
}

export { TextFilter }
