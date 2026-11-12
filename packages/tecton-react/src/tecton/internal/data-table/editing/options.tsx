"use client"

/**
 * The options editor's combobox, loaded on demand (`lazy.ts`, the
 * `editingOptions` feature) apart from the other editors: only a table
 * with an options column that can be written needs it. Until it is there,
 * the editor is a field with the same text (`editor.tsx`), so typing goes
 * on; it takes that field's place, text and focus.
 *
 * Every option shows until the user types; then those whose label holds
 * the text (case and accents aside), the first highlighted. Enter and Tab
 * save the option highlighted, else the text (read as an option's label or
 * value: one that is neither is refused); a click saves the option.
 * Escape cancels the edit, not only the list. The list, named by the
 * column, opens from the cell, in Tecton's portal.
 */
import * as React from "react"
import { cn } from "cn"

import { Badge } from "@tecton/react/components/badge"
import {
  Combobox,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@tecton/react/components/combobox"

import { useTranslations } from "../../i18n/translations"
import { foldText } from "../engine/format"
import type { DataTableOption } from "../engine/index"
import {
  FLUSH,
  Holder,
  keyMove,
  OPTION_FIELD,
  runKey,
  useTakeFocus,
  type EditorParts,
} from "./parts"

function OptionsCombobox({
  session,
  column,
  item,
  display,
  field,
  target,
  cell,
  text,
  onTextChange,
  typed,
}: EditorParts & {
  /** The field's text, the editor's (kept from the field before this one). */
  text: string
  /** `typed`: by the user (not the list's own). */
  onTextChange: (text: string, typed: boolean) => void
  /** The text was typed: the options are filtered by it. */
  typed: boolean
}) {
  const t = useTranslations("dataTable")
  const { options } = column
  const [open, setOpen] = React.useState(false)
  const highlighted = React.useRef<DataTableOption | undefined>(undefined)
  useTakeFocus(session, target)
  // Opened once the editor is laid out, from the cell.
  React.useEffect(() => setOpen(true), [])
  const index = column.optionIndex.get(String(column.getValue(item)))
  const selected = index === undefined ? null : options[index]
  const query = foldText(text.trim())
  const filtered = typed && query !== ""
  const shown = React.useMemo(
    () =>
      filtered
        ? options.filter((option) => foldText(option.label).includes(query))
        : options,
    [filtered, query, options]
  )
  React.useInsertionEffect(() => {
    session.read = () => {
      // The option highlighted; typed, the first that matches.
      const option = highlighted.current ?? (filtered ? shown[0] : undefined)
      return option
        ? { value: option.value, attempted: option.label }
        : { text }
    }
  })
  return (
    <Combobox<DataTableOption>
      items={options}
      filteredItems={shown}
      value={selected}
      inputValue={text}
      onInputValueChange={(next, details) =>
        onTextChange(next, details.reason === "input-change")
      }
      onValueChange={(option) => {
        if (option)
          session.controller.finish(session, {
            commit: true,
            draft: { value: option.value, attempted: option.label },
          })
      }}
      open={open}
      onOpenChange={(next, details) => {
        // Escape cancels the edit (the field's own keys), not only the list.
        if (details.reason !== "escape-key") setOpen(next)
      }}
      autoHighlight
      onItemHighlighted={(option) => {
        highlighted.current = option
      }}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <Holder>{display}</Holder>
      {/* The combobox's bare field: `ComboboxInput` is a bordered group
          with a trigger beside its field, which no class makes flush. */}
      <ComboboxChipsInput
        ref={target as React.RefObject<HTMLInputElement | null>}
        {...field}
        onKeyDown={(event) => {
          const move = keyMove(event, false)
          if (!move) return
          event.preventBaseUIHandler()
          runKey(session, event, move)
        }}
        autoComplete="off"
        className={cn(FLUSH, OPTION_FIELD)}
      />
      <ComboboxContent
        anchor={cell}
        // As wide as the cell, or its badges and checks.
        className="w-auto min-w-(--anchor-width)"
      >
        <ComboboxEmpty>{t("noMatchingOptions")}</ComboboxEmpty>
        <ComboboxList aria-label={column.header}>
          {(option: DataTableOption) => (
            <ComboboxItem key={option.value} value={option}>
              <Badge variant={option.variant ?? "outline"} appearance="outline">
                {option.label}
              </Badge>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export { OptionsCombobox }
