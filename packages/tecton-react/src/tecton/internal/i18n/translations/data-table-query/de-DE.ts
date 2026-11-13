/**
 * de-DE strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Begriffe nebeneinander eingeben: Jeder Begriff gilt. Ein Begriff ist ein Text, nach dem gesucht wird, oder eine Spalte mit ihren Werten. Ein Beispiel auswählen, um es hinzuzufügen.",
    helpExample: "Beispiel",
    helpFinds: "Findet",
    findsWords: "Zeilen mit diesem Text in einer beliebigen Spalte",
    findsPhrase: "Anführungszeichen halten Wörter zusammen",
    findsText: "{column} enthält den Text",
    findsOptions: "{column} ist einer der aufgeführten Werte",
    findsBoolean: "{column} ist Ja oder Nein",
    findsNumber: "{column} verglichen mit > >= < <= oder ein Bereich a..b",
    findsDate:
      "{column} in einem Jahr, einem Monat oder an einem Tag, vor < oder nach >, in einem Bereich a..b oder last30d, thismonth",
    findsNoValue: "{column} hat keinen Wert",
    helpFooter:
      "Groß- und Kleinschreibung spielt keine Rolle. Werte durch Kommas trennen, um einen davon zu finden.",
    typeText: "Text",
    typeNumber: "Zahl",
    typeDate: "Datum",
    typeBoolean: "Ja oder Nein",
    typeOptions: "Optionen",
    columnsGroup: "Nach Spalte filtern",
    matchingGroup: "Passende Werte",
    compareGroup: "Vergleichen",
    presetsGroup: "Vorgaben",
    yearsGroup: "Jahre",
    monthsGroup: "Monate",
    dataRange: "{min} bis {max} hier",
    moreThan: "Mehr als",
    atLeast: "Mindestens",
    lessThan: "Weniger als",
    atMost: "Höchstens",
    between: "Zwischen",
    before: "Vor",
    after: "Nach",
    presetToday: "Heute",
    presetYesterday: "Gestern",
    presetThisMonth: "Dieser Monat",
    presetLastMonth: "Letzter Monat",
    presetThisYear: "Dieses Jahr",
    presetLastYear: "Letztes Jahr",
    presetLastDays: {
      one: "Letzter {count} Tag",
      other: "Letzte {count} Tage",
    },
    presetLastWeeks: {
      one: "Letzte {count} Woche",
      other: "Letzte {count} Wochen",
    },
    presetLastMonths: {
      one: "Letzter {count} Monat",
      other: "Letzte {count} Monate",
    },
    presetLastYears: {
      one: "Letztes {count} Jahr",
      other: "Letzte {count} Jahre",
    },
    pickDates: "Daten im Kalender auswählen",
    pickDay: "Einen Tag im Kalender auswählen",
    calendarRange: "Einen Tag oder einen Anfang und ein Ende auswählen",
    calendarBefore: "Vor dem ausgewählten Tag",
    calendarAfter: "Nach dem ausgewählten Tag",
    calendarOnOrBefore: "Bis einschließlich zum ausgewählten Tag",
    calendarOnOrAfter: "Ab einschließlich dem ausgewählten Tag",
    keyMove: "Bewegen",
    keySelect: "Auswählen",
    keyComplete: "Vervollständigen",
    keyClose: "Schließen",
    footerAll: "Begriffe nebeneinander gelten alle",
    summaryFilters: "Filter: {filters}.",
    summaryNoFilters: "Keine Filter.",
    summarySearch: "Suche: {search}.",
    summaryProblems: {
      one: "{count} Problem: {problems}",
      other: "{count} Probleme: {problems}",
    },
    unknownColumn: "Keine Spalte heißt „{key}“.",
    unknownColumnSuggestion:
      "Keine Spalte heißt „{key}“. Meinten Sie {suggestion}?",
    columnNotFilterable: "{column} kann nicht gefiltert werden.",
    unknownValue: "{column} hat keinen Wert „{value}“.",
    unknownValueSuggestion:
      "{column} hat keinen Wert „{value}“. Meinten Sie {suggestion}?",
    notANumber: "„{value}“ ist keine Zahl.",
    badDate: "„{value}“ ist kein Datum.",
    ambiguousNoYear: "„{value}“ braucht ein Jahr, z. B. 2015-06-30.",
    ambiguousTwoDigitYear:
      "Das Jahr vollständig schreiben: „{value}“ kann in mehr als einem Jahrhundert liegen.",
    ambiguousMonth:
      "„{value}“ kann mehr als ein Monat sein: mehr vom Namen schreiben.",
    backwardsRange:
      "Dieser Bereich beginnt nach seinem Ende: {from} liegt nach {to}.",
    unsupportedOr:
      "OR wird nicht unterstützt: Jeder Begriff gilt. Um einen von mehreren Werten zu finden, die Werte durch Kommas trennen.",
    unsupportedNot:
      "Ausschließen wird nicht unterstützt: stattdessen nach den Werten filtern, die bleiben sollen. Um nach diesem Text zu suchen, ihn in Anführungszeichen setzen.",
    exclusiveComparison: "Mit Datum und Uhrzeit >= oder <= verwenden.",
    notComparable:
      "{column} hat keine Reihenfolge: stattdessen Werte auswählen.",
    multipleBoolean: "{column} ist Ja oder Nein, nicht beides.",
    multipleDates:
      "{column} nimmt ein Datum oder einen Bereich, z. B. 2015..2016.",
    duplicateNoMatch: "Keine Zeile kann beide Begriffe zu {column} erfüllen.",
    duplicateNotCombinable:
      "{column} wird weiter vorne in der Suche gefiltert: beides in einen Begriff schreiben.",
  },
})
