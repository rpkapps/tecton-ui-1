"use client"

import * as React from "react"

import type { RovingFocus } from "../roving-focus"
import type { Selection } from "../selection"
import type { Translator } from "../../i18n/translations"

type ChipRemoveReason = "remove-press" | "keyboard"

type ChipRootContextValue = {
  /** Set by the list: its chips in DOM order, and which are disabled. */
  collection: React.RefObject<{
    order: () => Array<string>
    isDisabled: (value: string) => boolean
  }>
  selection: Selection
  disabled: boolean
  removable: boolean
  remove: (
    values: Array<string>,
    reason: ChipRemoveReason,
    event?: Event | { nativeEvent: Event }
  ) => void
  t: Translator<"chip">
  /** The id of the hidden "Press Delete to remove tag." description. */
  removeDescriptionId: string
  /** The name of the grid, from the root's `aria-*` labelling props. */
  labelling: {
    "aria-label"?: string
    "aria-labelledby"?: string
    "aria-describedby"?: string
  }
}

type ChipItem = { element: HTMLElement; disabled: boolean; textValue: string }

type ChipListContextValue = {
  focus: RovingFocus
  register: (value: string, item: ChipItem) => () => void
}

type ChipContextValue = { value: string; rowId: string; disabled: boolean }

const ChipRootContext = React.createContext<ChipRootContextValue | null>(null)
const ChipListContext = React.createContext<ChipListContextValue | null>(null)
const ChipContext = React.createContext<ChipContextValue | null>(null)

function useRequired<T>(
  context: React.Context<T | null>,
  part: string,
  root: string
): T {
  const value = React.useContext(context)
  if (value === null)
    throw new Error(`Tecton: <${part}> must be placed within <${root}>.`)
  return value
}

export { ChipContext, ChipListContext, ChipRootContext, useRequired }
export type {
  ChipRemoveReason,
  ChipContextValue,
  ChipItem,
  ChipListContextValue,
  ChipRootContextValue,
}
