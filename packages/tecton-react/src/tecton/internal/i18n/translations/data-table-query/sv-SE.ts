/**
 * sv-SE strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Skriv termer bredvid varandra: alla termer gäller. En term är text att söka efter, eller en kolumn och dess värden. Välj ett exempel för att lägga till det.",
    helpExample: "Exempel",
    helpFinds: "Hittar",
    findsWords: "Rader med den här texten i någon kolumn",
    findsPhrase: "Citattecken håller ihop ord",
    findsText: "{column} innehåller texten",
    findsOptions: "{column} är något av de angivna värdena",
    findsBoolean: "{column} är ja eller nej",
    findsNumber: "{column} jämförd med > >= < <=, eller ett intervall a..b",
    findsDate:
      "{column} under ett år, en månad eller en dag, före < eller efter >, i ett intervall a..b, eller last30d, thismonth",
    findsNoValue: "{column} saknar värde",
    helpFooter:
      "Nycklar och värden skiftlägesokänsliga. Skilj värden åt med kommatecken för att hitta något av dem.",
    typeText: "Text",
    typeNumber: "Tal",
    typeDate: "Datum",
    typeBoolean: "Ja eller nej",
    typeOptions: "Alternativ",
    columnsGroup: "Filtrera på kolumn",
    matchingGroup: "Matchande värden",
    compareGroup: "Jämför",
    presetsGroup: "Förval",
    yearsGroup: "År",
    monthsGroup: "Månader",
    dataRange: "{min} till {max} här",
    equalTo: "Lika med",
    moreThan: "Mer än",
    atLeast: "Minst",
    lessThan: "Mindre än",
    atMost: "Högst",
    between: "Mellan",
    before: "Före",
    after: "Efter",
    presetToday: "Idag",
    presetYesterday: "Igår",
    presetThisMonth: "Den här månaden",
    presetLastMonth: "Förra månaden",
    presetThisYear: "I år",
    presetLastYear: "Förra året",
    presetLastDays: {
      one: "Senaste {count} dagen",
      other: "Senaste {count} dagarna",
    },
    presetLastWeeks: {
      one: "Senaste {count} veckan",
      other: "Senaste {count} veckorna",
    },
    presetLastMonths: {
      one: "Senaste {count} månaden",
      other: "Senaste {count} månaderna",
    },
    presetLastYears: {
      one: "Senaste {count} året",
      other: "Senaste {count} åren",
    },
    pickDates: "Välj datum i kalendern",
    pickDay: "Välj en dag i kalendern",
    calendarRange: "Välj en dag, eller en början och ett slut",
    calendarBefore: "Före dagen du väljer",
    calendarAfter: "Efter dagen du väljer",
    calendarOnOrBefore: "Till och med dagen du väljer",
    calendarOnOrAfter: "Från och med dagen du väljer",
    keyMove: "Flytta",
    keySelect: "Välj",
    keyComplete: "Komplettera",
    keyClose: "Stäng",
    summaryFilters: "Filter: {filters}.",
    summaryNoFilters: "Inga filter.",
    summarySearch: "Sökning: {search}.",
    summaryProblems: {
      one: "{count} problem: {problems}",
      other: "{count} problem: {problems}",
    },
    unknownColumn: "Ingen kolumn heter ”{key}”.",
    unknownColumnSuggestion:
      "Ingen kolumn heter ”{key}”. Menade du {suggestion}?",
    columnNotFilterable: "{column} kan inte filtreras.",
    unknownValue: "{column} har inget värde ”{value}”.",
    unknownValueSuggestion:
      "{column} har inget värde ”{value}”. Menade du {suggestion}?",
    notANumber: "”{value}” är inte ett tal.",
    badDate: "”{value}” är inte ett datum.",
    ambiguousNoYear: "”{value}” behöver ett år, som i 2015-06-30.",
    ambiguousTwoDigitYear:
      "Skriv året fullt ut: ”{value}” kan ligga i mer än ett sekel.",
    ambiguousMonth: "”{value}” kan vara mer än en månad: skriv mer av namnet.",
    backwardsRange:
      "Intervallet börjar efter att det slutar: {from} är efter {to}.",
    unsupportedOr:
      "OR stöds inte. Raderna måste matcha alla termer. Skriv värdena åtskilda med kommatecken för att hitta ett av flera värden i en kolumn: {example}",
    unsupportedOrNoList:
      "OR stöds inte. Raderna måste matcha alla termer, så sök efter en sak i taget.",
    unsupportedMinus:
      "Att utesluta stöds inte, så den här termen ignoreras. Sätt texten inom citattecken för att söka efter just den texten. Filtrera i stället på de värden som ska vara kvar för att begränsa raderna: {example}",
    unsupportedMinusNoFilter:
      "Att utesluta stöds inte, så den här termen ignoreras. Sätt texten inom citattecken för att söka efter just den texten.",
    exclusiveComparison: "Använd >= eller <= med datum och tid.",
    notComparable: "{column} har ingen ordning: välj dess värden i stället.",
    multipleBoolean: "{column} är ja eller nej, inte båda.",
    multipleDates:
      "{column} tar ett datum eller ett intervall, som 2015..2016.",
    duplicateNoMatch: "Ingen rad kan uppfylla båda termerna för {column}.",
    duplicateNotCombinable:
      "{column} filtreras redan tidigare i sökningen: skriv båda i en term.",
  },
})
