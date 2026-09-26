/**
 * Internal to `@tecton/react`: built into `dist/tecton/internal/` but absent
 * from the package `exports` map, so applications cannot import it. Tecton
 * modules import it by relative path; it holds no state.
 */

export type Direction = "ltr" | "rtl"

// Scripts and languages written right to left, for engines without
// `Intl.Locale#getTextInfo` (the same lists the Unicode CLDR data implies).
const RTL_SCRIPTS = new Set([
  "Adlm",
  "Arab",
  "Hebr",
  "Mand",
  "Mend",
  "Nkoo",
  "Rohg",
  "Samr",
  "Syrc",
  "Thaa",
])
const RTL_LANGUAGES = new Set([
  "ae",
  "ar",
  "arc",
  "bcc",
  "bqi",
  "ckb",
  "dv",
  "fa",
  "glk",
  "he",
  "iw",
  "ku",
  "mzn",
  "nqo",
  "pnb",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
])

type LocaleWithTextInfo = Intl.Locale & {
  getTextInfo?: () => { direction?: string }
  textInfo?: { direction?: string }
}

/** The direction a BCP 47 locale is written in. */
export function localeDirection(locale: string): Direction {
  try {
    const parsed = new Intl.Locale(locale) as LocaleWithTextInfo
    const info = parsed.getTextInfo?.() ?? parsed.textInfo
    if (info?.direction === "rtl" || info?.direction === "ltr") {
      return info.direction
    }
    const script = parsed.maximize().script
    if (script) return RTL_SCRIPTS.has(script) ? "rtl" : "ltr"
    return RTL_LANGUAGES.has(parsed.language) ? "rtl" : "ltr"
  } catch {
    const language = locale.split(/[-_]/)[0]?.toLowerCase() ?? ""
    return RTL_LANGUAGES.has(language) ? "rtl" : "ltr"
  }
}
