/**
 * What the browser does by itself with a key the page's handlers leave
 * alone, for a key pressed again (`pressAgain`, `index.tsx`): a key event
 * made by a script runs the handlers, not the browser's own action. Only
 * what a key pressed in a table can do: in a text field, a character
 * typed (a selection replaced), Backspace and Delete, a line break in a
 * text area, the caret moved by the arrows, Home and End (Shift extending
 * the selection); on a button, Enter and Space press it. A field's new
 * text is reported as typing reports it (an `input` event), so the
 * handlers that keep it see it.
 */
import type { KeyPress } from "../edits"

/** The text a key types into a field, if it types one. */
function typedBy(key: KeyPress) {
  if ([...key.key].length !== 1) return null
  if ((key.ctrlKey || key.metaKey) && !key.altGraph) return null
  return key.key
}

/** Sets a field's text as typing does: its own setter, then `input`. */
function setText(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const own = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(field) as object,
    "value"
  )
  if (own?.set) own.set.call(field, text)
  else field.value = text
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

/** The length of the character before or after a place (a pair of surrogates is one). */
function charLength(text: string, at: number, forward: boolean) {
  const code = text.charCodeAt(forward ? at : at - 1)
  const surrogate = forward
    ? code >= 0xd800 && code <= 0xdbff
    : code >= 0xdc00 && code <= 0xdfff
  return surrogate ? 2 : 1
}

function fieldDefault(
  field: HTMLInputElement | HTMLTextAreaElement,
  key: KeyPress
) {
  const text = field.value
  const start = field.selectionStart ?? text.length
  const end = field.selectionEnd ?? start
  const replace = (from: number, to: number, insert: string) => {
    setText(field, text.slice(0, from) + insert + text.slice(to))
    const caret = from + insert.length
    field.setSelectionRange(caret, caret)
  }
  const typed = typedBy(key)
  if (typed !== null) return replace(start, end, typed)
  const rtl =
    field.ownerDocument.defaultView?.getComputedStyle(field).direction === "rtl"
  // Where a caret move goes, from the moving end of the selection.
  const move = (to: number) => {
    const caret = Math.max(0, Math.min(text.length, to))
    if (key.shiftKey)
      field.setSelectionRange(Math.min(start, caret), Math.max(start, caret))
    else field.setSelectionRange(caret, caret)
  }
  switch (key.key) {
    case "Backspace":
      if (start !== end) return replace(start, end, "")
      if (start > 0) replace(start - charLength(text, start, false), start, "")
      return
    case "Delete":
      if (start !== end) return replace(start, end, "")
      if (start < text.length)
        replace(start, start + charLength(text, start, true), "")
      return
    case "Enter":
      if (field instanceof HTMLTextAreaElement) replace(start, end, "\n")
      return
    case "ArrowLeft":
    case "ArrowRight": {
      const forward = (key.key === "ArrowRight") !== rtl
      if (start !== end && !key.shiftKey) return move(forward ? end : start)
      return move(
        forward
          ? end + (end < text.length ? charLength(text, end, true) : 0)
          : end - (end > 0 ? charLength(text, end, false) : 0)
      )
    }
    case "Home":
    case "ArrowUp":
      return move(0)
    case "End":
    case "ArrowDown":
      return move(text.length)
  }
}

/** Does what the browser does with a key the handlers left alone (see the module comment). */
function keyDefault(target: HTMLElement, key: KeyPress) {
  if (
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement &&
      !["checkbox", "radio", "button", "submit"].includes(target.type))
  )
    return fieldDefault(target, key)
  if (
    target instanceof HTMLButtonElement &&
    (key.key === "Enter" || key.key === " ")
  )
    target.click()
}

export { keyDefault }
