/**
 * CSV export (§5.12): RFC 4180 text of items over columns, each cell its
 * display text (formatted in the formatter's locale, as the table shows it;
 * booleans as the Yes / No labels), the header row from `header`.
 *
 * - Fields holding a comma, a quote or a line break are quoted, quotes
 *   doubled; a record of one empty field is `""`, so it is not read as a
 *   blank line. Records end with CRLF, the last one too.
 * - `bom` starts the text with a byte order mark, which Excel needs to
 *   read UTF-8 (off by default: other readers take it as text).
 * - Formula injection (OWASP): a cell, header cells included, whose text
 *   starts with `=`, `+`, `-`, `@`, a tab or a carriage return gets a
 *   leading `'`, so a spreadsheet shows it rather than running it; only a
 *   formatted number (a number column's numeric value, "-5") is left as it
 *   is. `escapeFormulas: false` keeps every text as it is.
 *
 * The file name and download are the application's. Kept apart from the
 * rest of the engine so the root can load it when `exportCsv` is first
 * called.
 */
import type { EngineColumn } from "./columns"
import type { Formatter } from "./format"
import { toNumber } from "./values"

type CsvOptions = {
  /** Whether the first record is the columns' headers: `true` by default. */
  header?: boolean
  /** Whether to start with a byte order mark (for Excel): `false` by default. */
  bom?: boolean
  /** Whether to defuse text that a spreadsheet would run as a formula: `true` by default. */
  escapeFormulas?: boolean
}

const SPECIAL = /[",\r\n]/
const FORMULA = /^[=+\-@\t\r]/

function field(text: string) {
  return SPECIAL.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function record(fields: ReadonlyArray<string>) {
  return fields.length === 1 && fields[0] === "" ? '""' : fields.join(",")
}

function toCsv<T>(
  items: ReadonlyArray<T>,
  columns: ReadonlyArray<EngineColumn<T>>,
  formatter: Formatter<T>,
  options: CsvOptions = {}
): string {
  const escape = options.escapeFormulas !== false
  const defuse = (text: string) =>
    escape && FORMULA.test(text) ? `'${text}` : text
  const records: Array<string> = []
  if (options.header !== false)
    records.push(record(columns.map((column) => field(defuse(column.header)))))
  const fields = new Array<string>(columns.length)
  for (const item of items) {
    for (let c = 0; c < columns.length; c++) {
      const column = columns[c]
      const text = formatter.text(column, item)
      const number =
        column.type === "number" &&
        toNumber(column.getValue(item)) !== undefined
      fields[c] = field(number ? text : defuse(text))
    }
    records.push(record(fields))
  }
  const text = records.length ? `${records.join("\r\n")}\r\n` : ""
  return options.bom ? `\ufeff${text}` : text
}

export { toCsv }
export type { CsvOptions }
