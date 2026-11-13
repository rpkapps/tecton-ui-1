/**
 * et-EE strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Kirjutage tingimused kõrvuti: kehtivad kõik. Tingimus on otsitav tekst või veerg ja selle väärtused. Valige näide, et see lisada.",
    helpExample: "Näide",
    helpFinds: "Leiab",
    findsWords: "Read, mille mõnes veerus on see tekst",
    findsPhrase: "Jutumärgid hoiavad sõnu koos",
    findsText: "{column} sisaldab teksti",
    findsOptions: "{column} on üks loetletud väärtustest",
    findsBoolean: "{column} on jah või ei",
    findsNumber: "{column} võrreldes > >= < <= või vahemik a..b",
    findsDate:
      "{column} aastal, kuul või päeval, enne < või pärast >, vahemikus a..b või last30d, thismonth",
    findsNoValue: "{column}: väärtus puudub",
    helpFooter:
      "Võtmetes ja väärtustes pole suur- ja väiketähtedel vahet. Eraldage väärtused komadega, et leida ükskõik milline neist.",
    typeText: "Tekst",
    typeNumber: "Arv",
    typeDate: "Kuupäev",
    typeBoolean: "Jah või ei",
    typeOptions: "Valikud",
    columnsGroup: "Filtreeri veeru järgi",
    matchingGroup: "Sobivad väärtused",
    compareGroup: "Võrdle",
    presetsGroup: "Eelseaded",
    yearsGroup: "Aastad",
    monthsGroup: "Kuud",
    dataRange: "Siin {min} kuni {max}",
    moreThan: "Rohkem kui",
    atLeast: "Vähemalt",
    lessThan: "Vähem kui",
    atMost: "Kõige rohkem",
    between: "Vahemikus",
    before: "Enne",
    after: "Pärast",
    presetToday: "Täna",
    presetYesterday: "Eile",
    presetThisMonth: "See kuu",
    presetLastMonth: "Eelmine kuu",
    presetThisYear: "See aasta",
    presetLastYear: "Eelmine aasta",
    presetLastDays: {
      one: "Viimane {count} päev",
      other: "Viimased {count} päeva",
    },
    presetLastWeeks: {
      one: "Viimane {count} nädal",
      other: "Viimased {count} nädalat",
    },
    presetLastMonths: {
      one: "Viimane {count} kuu",
      other: "Viimased {count} kuud",
    },
    presetLastYears: {
      one: "Viimane {count} aasta",
      other: "Viimased {count} aastat",
    },
    pickDates: "Vali kuupäevad kalendrist",
    pickDay: "Vali päev kalendrist",
    calendarRange: "Valige päev või algus ja lõpp",
    calendarBefore: "Enne valitud päeva",
    calendarAfter: "Pärast valitud päeva",
    calendarOnOrBefore: "Kuni valitud päevani kaasa arvatud",
    calendarOnOrAfter: "Alates valitud päevast kaasa arvatud",
    keyMove: "Liigu",
    keySelect: "Vali",
    keyComplete: "Täienda",
    keyClose: "Sulge",
    summaryFilters: "Filtrid: {filters}.",
    summaryNoFilters: "Filtreid pole.",
    summarySearch: "Otsing: {search}.",
    summaryProblems: {
      one: "{count} probleem: {problems}",
      other: "{count} probleemi: {problems}",
    },
    unknownColumn: "Veergu „{key}” pole.",
    unknownColumnSuggestion: "Veergu „{key}” pole. Kas mõtlesite {suggestion}?",
    columnNotFilterable: "Veergu {column} ei saa filtreerida.",
    unknownValue: "Veerus {column} pole väärtust „{value}”.",
    unknownValueSuggestion:
      "Veerus {column} pole väärtust „{value}”. Kas mõtlesite {suggestion}?",
    notANumber: "„{value}” pole arv.",
    badDate: "„{value}” pole kuupäev.",
    ambiguousNoYear: "„{value}” vajab aastat, nt 2015-06-30.",
    ambiguousTwoDigitYear:
      "Kirjutage aasta täielikult: „{value}” võib olla mitmes sajandis.",
    ambiguousMonth: "„{value}” võib olla mitu kuud: kirjutage nimest rohkem.",
    backwardsRange: "See vahemik algab pärast lõppu: {from} on pärast {to}.",
    unsupportedOr:
      "OR ei ole toetatud. Read peavad vastama kõigile tingimustele. Veeru mitmest väärtusest ühe leidmiseks kirjutage need komadega eraldatult: {example}",
    unsupportedOrNoList:
      "OR ei ole toetatud. Read peavad vastama kõigile tingimustele, seega otsige üht asja korraga.",
    unsupportedMinus:
      "Välistamine ei ole toetatud, seega seda tingimust ei arvestata. Teksti enda otsimiseks pange see jutumärkidesse. Ridade kitsendamiseks filtreerige selle asemel alles jäävad väärtused: {example}",
    unsupportedMinusNoFilter:
      "Välistamine ei ole toetatud, seega seda tingimust ei arvestata. Teksti enda otsimiseks pange see jutumärkidesse.",
    unsupportedNot:
      "Välistamine ei ole toetatud, seega NOT-i ei arvestata ja selle kõrval olevad tingimused kehtivad edasi. Ridade kitsendamiseks filtreerige selle asemel alles jäävad väärtused: {example}",
    unsupportedNotNoFilter:
      "Välistamine ei ole toetatud, seega NOT-i ei arvestata ja selle kõrval olevad tingimused kehtivad edasi.",
    exclusiveComparison: "Kuupäeva ja kellaajaga kasutage >= või <=.",
    notComparable:
      "Veerul {column} pole järjestust: valige selle asemel väärtused.",
    multipleBoolean: "{column} on jah või ei, mitte mõlemad.",
    multipleDates:
      "{column} võtab ühe kuupäeva või ühe vahemiku, nt 2015..2016.",
    duplicateNoMatch:
      "Ükski rida ei saa vastata mõlemale veeru {column} tingimusele.",
    duplicateNotCombinable:
      "Veergu {column} filtreeritakse otsingus juba varem: kirjutage mõlemad ühte tingimusse.",
  },
})
