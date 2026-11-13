/**
 * da-DK strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Skriv termer ved siden af hinanden: alle termer gælder. En term er tekst at søge efter eller en kolonne og dens værdier. Vælg et eksempel for at tilføje det.",
    helpExample: "Eksempel",
    helpFinds: "Finder",
    findsWords: "Rækker med denne tekst i en kolonne",
    findsPhrase: "Anførselstegn holder ord sammen",
    findsText: "{column} indeholder teksten",
    findsOptions: "{column} er en af de angivne værdier",
    findsBoolean: "{column} er ja eller nej",
    findsNumber: "{column} sammenlignet med > >= < <= eller et interval a..b",
    findsDate:
      "{column} i et år, en måned eller på en dag, før < eller efter >, i et interval a..b eller last30d, thismonth",
    findsNoValue: "{column} har ingen værdi",
    helpFooter:
      "Nøgler og værdier skelner ikke mellem store og små bogstaver. Adskil værdier med kommaer for at finde en af dem.",
    typeText: "Tekst",
    typeNumber: "Tal",
    typeDate: "Dato",
    typeBoolean: "Ja eller nej",
    typeOptions: "Valgmuligheder",
    columnsGroup: "Filtrer efter kolonne",
    matchingGroup: "Matchende værdier",
    compareGroup: "Sammenlign",
    presetsGroup: "Forudindstillinger",
    yearsGroup: "År",
    monthsGroup: "Måneder",
    dataRange: "{min} til {max} her",
    moreThan: "Mere end",
    atLeast: "Mindst",
    lessThan: "Mindre end",
    atMost: "Højst",
    between: "Mellem",
    before: "Før",
    after: "Efter",
    presetToday: "I dag",
    presetYesterday: "I går",
    presetThisMonth: "Denne måned",
    presetLastMonth: "Sidste måned",
    presetThisYear: "I år",
    presetLastYear: "Sidste år",
    presetLastDays: {
      one: "Seneste {count} dag",
      other: "Seneste {count} dage",
    },
    presetLastWeeks: {
      one: "Seneste {count} uge",
      other: "Seneste {count} uger",
    },
    presetLastMonths: {
      one: "Seneste {count} måned",
      other: "Seneste {count} måneder",
    },
    presetLastYears: { one: "Seneste {count} år", other: "Seneste {count} år" },
    pickDates: "Vælg datoer i kalenderen",
    pickDay: "Vælg en dag i kalenderen",
    calendarRange: "Vælg en dag eller en start og en slutning",
    calendarBefore: "Før den dag, du vælger",
    calendarAfter: "Efter den dag, du vælger",
    calendarOnOrBefore: "Til og med den dag, du vælger",
    calendarOnOrAfter: "Fra og med den dag, du vælger",
    keyMove: "Flyt",
    keySelect: "Vælg",
    keyComplete: "Fuldfør",
    keyClose: "Luk",
    summaryFilters: "Filtre: {filters}.",
    summaryNoFilters: "Ingen filtre.",
    summarySearch: "Søgning: {search}.",
    summaryProblems: {
      one: "{count} problem: {problems}",
      other: "{count} problemer: {problems}",
    },
    unknownColumn: "Ingen kolonne hedder “{key}”.",
    unknownColumnSuggestion:
      "Ingen kolonne hedder “{key}”. Mente du {suggestion}?",
    columnNotFilterable: "{column} kan ikke filtreres.",
    unknownValue: "{column} har ikke værdien “{value}”.",
    unknownValueSuggestion:
      "{column} har ikke værdien “{value}”. Mente du {suggestion}?",
    notANumber: "“{value}” er ikke et tal.",
    badDate: "“{value}” er ikke en dato.",
    ambiguousNoYear: "“{value}” skal have et år, som i 2015-06-30.",
    ambiguousTwoDigitYear:
      "Skriv året fuldt ud: “{value}” kan ligge i mere end ét århundrede.",
    ambiguousMonth:
      "“{value}” kan være mere end én måned: skriv mere af navnet.",
    backwardsRange:
      "Intervallet starter efter det slutter: {from} er efter {to}.",
    unsupportedOr:
      "OR understøttes ikke: alle termer gælder. Adskil værdier med kommaer for at finde en af flere værdier.",
    unsupportedNot:
      "Udelukkelse understøttes ikke: filtrer i stedet efter de værdier, der skal blive. Sæt teksten i anførselstegn for at søge efter den.",
    exclusiveComparison: "Brug >= eller <= med dato og klokkeslæt.",
    notComparable: "{column} har ingen rækkefølge: vælg i stedet dens værdier.",
    multipleBoolean: "{column} er ja eller nej, ikke begge.",
    multipleDates: "{column} tager én dato eller ét interval, som 2015..2016.",
    duplicateNoMatch: "Ingen række kan opfylde begge termer for {column}.",
    duplicateNotCombinable:
      "{column} filtreres allerede tidligere i søgningen: skriv begge i én term.",
  },
})
