/**
 * Cells as the clipboard holds them between spreadsheets: tab-separated
 * text (as Excel and Google Sheets write and read it) and an HTML table
 * (which they read as cells too, keeping a cell with a line break whole).
 *
 * - A field holding a tab, a line break or a quote is quoted, its quotes
 *   doubled; rows are separated by CRLF, with none after the last.
 * - Reading takes CRLF, LF or CR between rows, drops the line break after
 *   the last row (Excel ends with one), reads quoted fields (a quote that
 *   is never closed is a quote of the text), and gives every row as many
 *   fields as the longest, empty ones filling.
 */

const SPECIAL = /[\t\r\n"]/

function tsvField(text: string) {
  return SPECIAL.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Rows of fields as tab-separated text. */
function toTsv(rows: ReadonlyArray<ReadonlyArray<string>>): string {
  return rows.map((fields) => fields.map(tsvField).join("\t")).join("\r\n")
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
}

function escapeHtml(text: string) {
  return text
    .replace(/[&<>"]/g, (character) => ESCAPES[character])
    .replace(/\r\n|\r|\n/g, "<br>")
}

/** Rows of fields as an HTML table. */
function toHtml(rows: ReadonlyArray<ReadonlyArray<string>>): string {
  const body = rows
    .map(
      (fields) =>
        `<tr>${fields.map((field) => `<td>${escapeHtml(field)}</td>`).join("")}</tr>`
    )
    .join("")
  return `<table><tbody>${body}</tbody></table>`
}

/** Tab-separated text as rows of fields; `[]` for no text. */
function parseTsv(text: string): Array<Array<string>> {
  if (text === "") return []
  const rows: Array<Array<string>> = []
  let fields: Array<string> = []
  let at = 0
  const length = text.length
  const endRow = () => {
    rows.push(fields)
    fields = []
  }
  while (at <= length) {
    let field = ""
    if (text[at] === '"') {
      // Quoted: up to the quote not doubled, then what follows up to the
      // separator. Never closed: the quote is the text's own.
      let close = -1
      for (let i = at + 1; i < length; i++) {
        if (text[i] !== '"') continue
        if (text[i + 1] === '"') {
          i++
          continue
        }
        close = i
        break
      }
      if (close >= 0) {
        field = text.slice(at + 1, close).replace(/""/g, '"')
        at = close + 1
      }
    }
    let end = at
    while (end < length && !"\t\r\n".includes(text[end])) end++
    field += text.slice(at, end)
    fields.push(field)
    if (end >= length) {
      endRow()
      break
    }
    if (text[end] === "\t") {
      at = end + 1
      continue
    }
    endRow()
    at = end + (text[end] === "\r" && text[end + 1] === "\n" ? 2 : 1)
    // The line break after the last row ends the text.
    if (at >= length) break
  }
  let width = 0
  for (const row of rows) width = Math.max(width, row.length)
  for (const row of rows) while (row.length < width) row.push("")
  return rows
}

export { parseTsv, toHtml, toTsv }
