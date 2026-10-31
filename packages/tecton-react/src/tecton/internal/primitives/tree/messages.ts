/**
 * Internal to `@tecton/react`: localized strings, one entry per locale.
 *
 * Copied from React Aria (`react-aria` 3.52, `intl/tree`), © Adobe,
 * Apache License 2.0 (https://www.apache.org/licenses/LICENSE-2.0), with
 * ICU placeholders written as `{name}` and plurals as category maps (see
 * `useMessages`). A locale missing here falls back to its language, then
 * to `en-US`.
 */
import type { MessageTable } from "../messages"

type Keys =
  | "expand"
  | "collapse"

const TREE_MESSAGES: MessageTable<Keys> = {
  "ar-AE": {
    expand: "تمديد",
    collapse: "طي",
  },
  "bg-BG": {
    expand: "Разширяване",
    collapse: "Свиване",
  },
  "cs-CZ": {
    expand: "Roztáhnout",
    collapse: "Sbalit",
  },
  "da-DK": {
    expand: "Udvid",
    collapse: "Skjul",
  },
  "de-DE": {
    expand: "Erweitern",
    collapse: "Reduzieren",
  },
  "el-GR": {
    expand: "Ανάπτυξη",
    collapse: "Σύμπτυξη",
  },
  "en-US": {
    expand: "Expand",
    collapse: "Collapse",
  },
  "es-ES": {
    expand: "Expandir",
    collapse: "Contraer",
  },
  "et-EE": {
    expand: "Laienda",
    collapse: "Ahenda",
  },
  "fi-FI": {
    expand: "Laajenna",
    collapse: "Pienennä",
  },
  "fr-FR": {
    expand: "Développer",
    collapse: "Réduire",
  },
  "he-IL": {
    expand: "הרחב",
    collapse: "כווץ",
  },
  "hr-HR": {
    expand: "Proširi",
    collapse: "Sažmi",
  },
  "hu-HU": {
    expand: "Kibontás",
    collapse: "Összecsukás",
  },
  "it-IT": {
    expand: "Espandi",
    collapse: "Comprimi",
  },
  "ja-JP": {
    expand: "展開",
    collapse: "折りたたむ",
  },
  "ko-KR": {
    expand: "펼치기",
    collapse: "접기",
  },
  "lt-LT": {
    expand: "Išskleisti",
    collapse: "Sutraukti",
  },
  "lv-LV": {
    expand: "Izvērst",
    collapse: "Sakļaut",
  },
  "nb-NO": {
    expand: "Utvid",
    collapse: "Skjul",
  },
  "nl-NL": {
    expand: "Uitvouwen",
    collapse: "Samenvouwen",
  },
  "pl-PL": {
    expand: "Rozwiń",
    collapse: "Zwiń",
  },
  "pt-BR": {
    expand: "Expandir",
    collapse: "Recolher",
  },
  "pt-PT": {
    expand: "Expandir",
    collapse: "Colapsar",
  },
  "ro-RO": {
    expand: "Extindeți",
    collapse: "Restrângeți",
  },
  "ru-RU": {
    expand: "Развернуть",
    collapse: "Свернуть",
  },
  "sk-SK": {
    expand: "Rozbaliť",
    collapse: "Zbaliť",
  },
  "sl-SI": {
    expand: "Razširi",
    collapse: "Strni",
  },
  "sr-SP": {
    expand: "Proširi",
    collapse: " Skupi",
  },
  "sv-SE": {
    expand: "Expandera",
    collapse: "Dölj",
  },
  "tr-TR": {
    expand: "Genişlet",
    collapse: "Daralt",
  },
  "uk-UA": {
    expand: "Розгорнути",
    collapse: "Згорнути",
  },
  "zh-CN": {
    expand: "扩展",
    collapse: "折叠",
  },
  "zh-TW": {
    expand: "展開",
    collapse: "收合",
  },
}

export { TREE_MESSAGES }
