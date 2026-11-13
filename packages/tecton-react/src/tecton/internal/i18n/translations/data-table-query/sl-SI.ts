/**
 * sl-SI strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Pogoje vpisujte drugega ob drugem: veljajo vsi. Pogoj je besedilo za iskanje ali stolpec in njegove vrednosti. Izberite primer, da ga dodate.",
    helpExample: "Primer",
    helpFinds: "Najde",
    findsWords: "Vrstice s tem besedilom v katerem koli stolpcu",
    findsPhrase: "Narekovaji držijo besede skupaj",
    findsText: "{column} vsebuje besedilo",
    findsOptions: "{column} je ena od navedenih vrednosti",
    findsBoolean: "{column} je da ali ne",
    findsNumber: "{column} primerjano z > >= < <= ali obseg a..b",
    findsDate:
      "{column} v letu, mesecu ali dnevu, pred < ali po >, v obsegu a..b ali last30d, thismonth",
    findsNoValue: "{column} nima vrednosti",
    helpFooter:
      "Ključi in vrednosti ne razlikujejo velikih in malih črk. Vrednosti ločite z vejicami, da najdete katero koli od njih.",
    typeText: "Besedilo",
    typeNumber: "Število",
    typeDate: "Datum",
    typeBoolean: "Da ali ne",
    typeOptions: "Možnosti",
    columnsGroup: "Filtriraj po stolpcu",
    matchingGroup: "Ujemajoče se vrednosti",
    compareGroup: "Primerjaj",
    presetsGroup: "Prednastavitve",
    yearsGroup: "Leta",
    monthsGroup: "Meseci",
    dataRange: "Tu od {min} do {max}",
    moreThan: "Več kot",
    atLeast: "Vsaj",
    lessThan: "Manj kot",
    atMost: "Največ",
    between: "Med",
    before: "Pred",
    after: "Po",
    presetToday: "Danes",
    presetYesterday: "Včeraj",
    presetThisMonth: "Ta mesec",
    presetLastMonth: "Prejšnji mesec",
    presetThisYear: "Letos",
    presetLastYear: "Lani",
    presetLastDays: {
      one: "Zadnji {count} dan",
      two: "Zadnja {count} dneva",
      few: "Zadnji {count} dnevi",
      other: "Zadnjih {count} dni",
    },
    presetLastWeeks: {
      one: "Zadnji {count} teden",
      two: "Zadnja {count} tedna",
      few: "Zadnji {count} tedni",
      other: "Zadnjih {count} tednov",
    },
    presetLastMonths: {
      one: "Zadnji {count} mesec",
      two: "Zadnja {count} meseca",
      few: "Zadnji {count} meseci",
      other: "Zadnjih {count} mesecev",
    },
    presetLastYears: {
      one: "Zadnje {count} leto",
      two: "Zadnji {count} leti",
      few: "Zadnja {count} leta",
      other: "Zadnjih {count} let",
    },
    pickDates: "Izberi datume v koledarju",
    pickDay: "Izberi dan v koledarju",
    calendarRange: "Izberite dan ali začetek in konec",
    calendarBefore: "Pred izbranim dnem",
    calendarAfter: "Po izbranem dnevu",
    calendarOnOrBefore: "Do vključno izbranega dne",
    calendarOnOrAfter: "Od vključno izbranega dne",
    keyMove: "Premakni",
    keySelect: "Izberi",
    keyComplete: "Dopolni",
    keyClose: "Zapri",
    summaryFilters: "Filtri: {filters}.",
    summaryNoFilters: "Ni filtrov.",
    summarySearch: "Iskanje: {search}.",
    summaryProblems: {
      one: "{count} težava: {problems}",
      two: "{count} težavi: {problems}",
      few: "{count} težave: {problems}",
      other: "{count} težav: {problems}",
    },
    unknownColumn: "Noben stolpec se ne imenuje »{key}«.",
    unknownColumnSuggestion:
      "Noben stolpec se ne imenuje »{key}«. Ste mislili {suggestion}?",
    columnNotFilterable: "Stolpca {column} ni mogoče filtrirati.",
    unknownValue: "{column} nima vrednosti »{value}«.",
    unknownValueSuggestion:
      "{column} nima vrednosti »{value}«. Ste mislili {suggestion}?",
    notANumber: "»{value}« ni število.",
    badDate: "»{value}« ni datum.",
    ambiguousNoYear: "»{value}« potrebuje leto, na primer 2015-06-30.",
    ambiguousTwoDigitYear:
      "Napišite celo letnico: »{value}« je lahko v več stoletjih.",
    ambiguousMonth: "»{value}« je lahko več mesecev: napišite več imena.",
    backwardsRange: "Ta obseg se začne po svojem koncu: {from} je po {to}.",
    unsupportedOr:
      "OR ni podprt. Vrstice morajo ustrezati vsakemu pogoju. Če želite najti eno od več vrednosti stolpca, jih naštejte, ločene z vejicami: {example}",
    unsupportedOrNoList:
      "OR ni podprt. Vrstice morajo ustrezati vsakemu pogoju, zato iščite eno stvar naenkrat.",
    unsupportedMinus:
      "Izključevanje ni podprto, zato se ta pogoj ne upošteva. Če želite iskati prav to besedilo, ga postavite v narekovaje. Če želite zožiti vrstice, raje filtrirajte vrednosti, ki jih želite obdržati: {example}",
    unsupportedMinusNoFilter:
      "Izključevanje ni podprto, zato se ta pogoj ne upošteva. Če želite iskati prav to besedilo, ga postavite v narekovaje.",
    unsupportedNot:
      "Izključevanje ni podprto, zato se NOT ne upošteva, pogoji ob njem pa še vedno veljajo. Če želite zožiti vrstice, raje filtrirajte vrednosti, ki jih želite obdržati: {example}",
    unsupportedNotNoFilter:
      "Izključevanje ni podprto, zato se NOT ne upošteva, pogoji ob njem pa še vedno veljajo.",
    exclusiveComparison: "Pri datumu s časom uporabite >= ali <=.",
    notComparable:
      "{column} nima vrstnega reda: raje izberite njegove vrednosti.",
    multipleBoolean: "{column} je da ali ne, ne oboje.",
    multipleDates:
      "{column} sprejme en datum ali en obseg, na primer 2015..2016.",
    duplicateNoMatch:
      "Nobena vrstica ne more izpolniti obeh pogojev za {column}.",
    duplicateNotCombinable:
      "{column} je že filtriran prej v iskanju: združite oba v en pogoj.",
  },
})
