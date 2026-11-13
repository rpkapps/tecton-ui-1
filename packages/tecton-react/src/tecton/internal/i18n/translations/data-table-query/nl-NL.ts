/**
 * nl-NL strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Typ termen naast elkaar: elke term geldt. Een term is tekst om naar te zoeken, of een kolom en de waarden ervan. Kies een voorbeeld om het toe te voegen.",
    helpExample: "Voorbeeld",
    helpFinds: "Vindt",
    findsWords: "Rijen met deze tekst in een kolom",
    findsPhrase: "Aanhalingstekens houden woorden bij elkaar",
    findsText: "{column} bevat de tekst",
    findsOptions: "{column} is een van de vermelde waarden",
    findsBoolean: "{column} is ja of nee",
    findsNumber: "{column} vergeleken met > >= < <=, of een bereik a..b",
    findsDate:
      "{column} in een jaar, een maand of op een dag, voor < of na >, in een bereik a..b, of last30d, thismonth",
    findsNoValue: "{column} heeft geen waarde",
    helpFooter:
      "Sleutels en waarden negeren hoofdletters. Scheid waarden met komma’s om een ervan te vinden.",
    typeText: "Tekst",
    typeNumber: "Getal",
    typeDate: "Datum",
    typeBoolean: "Ja of nee",
    typeOptions: "Opties",
    columnsGroup: "Filteren op kolom",
    matchingGroup: "Overeenkomende waarden",
    compareGroup: "Vergelijken",
    presetsGroup: "Voorinstellingen",
    yearsGroup: "Jaren",
    monthsGroup: "Maanden",
    dataRange: "{min} tot {max} hier",
    moreThan: "Meer dan",
    atLeast: "Ten minste",
    lessThan: "Minder dan",
    atMost: "Ten hoogste",
    between: "Tussen",
    before: "Voor",
    after: "Na",
    presetToday: "Vandaag",
    presetYesterday: "Gisteren",
    presetThisMonth: "Deze maand",
    presetLastMonth: "Vorige maand",
    presetThisYear: "Dit jaar",
    presetLastYear: "Vorig jaar",
    presetLastDays: {
      one: "Laatste {count} dag",
      other: "Laatste {count} dagen",
    },
    presetLastWeeks: {
      one: "Laatste {count} week",
      other: "Laatste {count} weken",
    },
    presetLastMonths: {
      one: "Laatste {count} maand",
      other: "Laatste {count} maanden",
    },
    presetLastYears: {
      one: "Laatste {count} jaar",
      other: "Laatste {count} jaar",
    },
    pickDates: "Datums kiezen in de kalender",
    pickDay: "Een dag kiezen in de kalender",
    calendarRange: "Kies een dag, of een begin en een einde",
    calendarBefore: "Voor de gekozen dag",
    calendarAfter: "Na de gekozen dag",
    calendarOnOrBefore: "Tot en met de gekozen dag",
    calendarOnOrAfter: "Vanaf de gekozen dag",
    keyMove: "Verplaatsen",
    keySelect: "Selecteren",
    keyComplete: "Aanvullen",
    keyClose: "Sluiten",
    summaryFilters: "Filters: {filters}.",
    summaryNoFilters: "Geen filters.",
    summarySearch: "Zoeken: {search}.",
    summaryProblems: {
      one: "{count} probleem: {problems}",
      other: "{count} problemen: {problems}",
    },
    unknownColumn: "Geen kolom heet ‘{key}’.",
    unknownColumnSuggestion:
      "Geen kolom heet ‘{key}’. Bedoelde u {suggestion}?",
    columnNotFilterable: "{column} kan niet worden gefilterd.",
    unknownValue: "{column} heeft geen waarde ‘{value}’.",
    unknownValueSuggestion:
      "{column} heeft geen waarde ‘{value}’. Bedoelde u {suggestion}?",
    notANumber: "‘{value}’ is geen getal.",
    badDate: "‘{value}’ is geen datum.",
    ambiguousNoYear: "‘{value}’ heeft een jaar nodig, zoals in 2015-06-30.",
    ambiguousTwoDigitYear:
      "Schrijf het jaar voluit: ‘{value}’ kan in meer dan één eeuw vallen.",
    ambiguousMonth:
      "‘{value}’ kan meer dan één maand zijn: schrijf meer van de naam.",
    backwardsRange: "Dit bereik begint na het einde: {from} ligt na {to}.",
    unsupportedOr:
      "OR wordt niet ondersteund. Rijen moeten aan elke term voldoen. Noem de waarden gescheiden door komma’s om een van meerdere waarden van een kolom te vinden: {example}",
    unsupportedOrNoList:
      "OR wordt niet ondersteund. Rijen moeten aan elke term voldoen, dus zoek naar één ding tegelijk.",
    unsupportedMinus:
      "Uitsluiten wordt niet ondersteund, dus deze term wordt genegeerd. Zet de tekst tussen aanhalingstekens om naar precies die tekst te zoeken. Filter in plaats daarvan op de waarden die u wilt houden om de rijen te beperken: {example}",
    unsupportedMinusNoFilter:
      "Uitsluiten wordt niet ondersteund, dus deze term wordt genegeerd. Zet de tekst tussen aanhalingstekens om naar precies die tekst te zoeken.",
    unsupportedNot:
      "Uitsluiten wordt niet ondersteund, dus NOT wordt genegeerd en de termen ernaast gelden nog steeds. Filter in plaats daarvan op de waarden die u wilt houden om de rijen te beperken: {example}",
    unsupportedNotNoFilter:
      "Uitsluiten wordt niet ondersteund, dus NOT wordt genegeerd en de termen ernaast gelden nog steeds.",
    exclusiveComparison: "Gebruik >= of <= met een datum en tijd.",
    notComparable:
      "{column} heeft geen volgorde: kies in plaats daarvan de waarden.",
    multipleBoolean: "{column} is ja of nee, niet allebei.",
    multipleDates: "{column} neemt één datum of één bereik, zoals 2015..2016.",
    duplicateNoMatch: "Geen rij kan aan beide termen voor {column} voldoen.",
    duplicateNotCombinable:
      "{column} wordt eerder in de zoekopdracht gefilterd: zet beide in één term.",
  },
})
