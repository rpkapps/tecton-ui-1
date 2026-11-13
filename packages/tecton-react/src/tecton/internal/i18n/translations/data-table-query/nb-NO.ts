/**
 * nb-NO strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Skriv termer ved siden av hverandre: alle termene gjelder. En term er tekst å søke etter, eller en kolonne og verdiene dens. Velg et eksempel for å legge det til.",
    helpExample: "Eksempel",
    helpFinds: "Finner",
    findsWords: "Rader med denne teksten i en kolonne",
    findsPhrase: "Anførselstegn holder ord sammen",
    findsText: "{column} inneholder teksten",
    findsOptions: "{column} er en av verdiene som er oppført",
    findsBoolean: "{column} er ja eller nei",
    findsNumber: "{column} sammenlignet med > >= < <=, eller et område a..b",
    findsDate:
      "{column} i et år, en måned eller på en dag, før < eller etter >, i et område a..b, eller last30d, thismonth",
    findsNoValue: "{column} har ingen verdi",
    helpFooter:
      "Nøkler og verdier skiller ikke mellom store og små bokstaver. Skill verdier med komma for å finne en av dem.",
    typeText: "Tekst",
    typeNumber: "Tall",
    typeDate: "Dato",
    typeBoolean: "Ja eller nei",
    typeOptions: "Alternativer",
    columnsGroup: "Filtrer etter kolonne",
    matchingGroup: "Samsvarende verdier",
    compareGroup: "Sammenlign",
    presetsGroup: "Forhåndsvalg",
    yearsGroup: "År",
    monthsGroup: "Måneder",
    dataRange: "{min} til {max} her",
    moreThan: "Mer enn",
    atLeast: "Minst",
    lessThan: "Mindre enn",
    atMost: "Høyst",
    between: "Mellom",
    before: "Før",
    after: "Etter",
    presetToday: "I dag",
    presetYesterday: "I går",
    presetThisMonth: "Denne måneden",
    presetLastMonth: "Forrige måned",
    presetThisYear: "I år",
    presetLastYear: "I fjor",
    presetLastDays: { one: "Siste {count} dag", other: "Siste {count} dager" },
    presetLastWeeks: { one: "Siste {count} uke", other: "Siste {count} uker" },
    presetLastMonths: {
      one: "Siste {count} måned",
      other: "Siste {count} måneder",
    },
    presetLastYears: { one: "Siste {count} år", other: "Siste {count} år" },
    pickDates: "Velg datoer i kalenderen",
    pickDay: "Velg en dag i kalenderen",
    calendarRange: "Velg en dag, eller en start og en slutt",
    calendarBefore: "Før dagen du velger",
    calendarAfter: "Etter dagen du velger",
    calendarOnOrBefore: "Til og med dagen du velger",
    calendarOnOrAfter: "Fra og med dagen du velger",
    keyMove: "Flytt",
    keySelect: "Velg",
    keyComplete: "Fullfør",
    keyClose: "Lukk",
    summaryFilters: "Filtre: {filters}.",
    summaryNoFilters: "Ingen filtre.",
    summarySearch: "Søk: {search}.",
    summaryProblems: {
      one: "{count} problem: {problems}",
      other: "{count} problemer: {problems}",
    },
    unknownColumn: "Ingen kolonne heter «{key}».",
    unknownColumnSuggestion:
      "Ingen kolonne heter «{key}». Mente du {suggestion}?",
    columnNotFilterable: "{column} kan ikke filtreres.",
    unknownValue: "{column} har ikke verdien «{value}».",
    unknownValueSuggestion:
      "{column} har ikke verdien «{value}». Mente du {suggestion}?",
    notANumber: "«{value}» er ikke et tall.",
    badDate: "«{value}» er ikke en dato.",
    ambiguousNoYear: "«{value}» trenger et år, som i 2015-06-30.",
    ambiguousTwoDigitYear:
      "Skriv hele årstallet: «{value}» kan ligge i mer enn ett århundre.",
    ambiguousMonth: "«{value}» kan være mer enn én måned: skriv mer av navnet.",
    backwardsRange:
      "Området starter etter at det slutter: {from} er etter {to}.",
    unsupportedOr:
      "OR støttes ikke. Radene må samsvare med alle termene. Skriv verdiene skilt med komma for å finne én av flere verdier i en kolonne: {example}",
    unsupportedOrNoList:
      "OR støttes ikke. Radene må samsvare med alle termene, så søk etter én ting om gangen.",
    unsupportedMinus:
      "Utelukking støttes ikke, så denne termen ignoreres. Sett teksten i anførselstegn for å søke etter selve teksten. Filtrer heller etter verdiene som skal være med, for å snevre inn radene: {example}",
    unsupportedMinusNoFilter:
      "Utelukking støttes ikke, så denne termen ignoreres. Sett teksten i anførselstegn for å søke etter selve teksten.",
    exclusiveComparison: "Bruk >= eller <= med dato og klokkeslett.",
    notComparable: "{column} har ingen rekkefølge: velg verdiene i stedet.",
    multipleBoolean: "{column} er ja eller nei, ikke begge.",
    multipleDates: "{column} tar én dato eller ett område, som 2015..2016.",
    duplicateNoMatch: "Ingen rad kan oppfylle begge termene for {column}.",
    duplicateNotCombinable:
      "{column} filtreres allerede tidligere i søket: skriv begge i én term.",
  },
})
