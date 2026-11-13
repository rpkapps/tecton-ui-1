/**
 * sk-SK strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Zadávajte podmienky vedľa seba: platia všetky. Podmienka je text na vyhľadanie alebo stĺpec a jeho hodnoty. Výberom príkladu ho pridáte.",
    helpExample: "Príklad",
    helpFinds: "Nájde",
    findsWords: "Riadky s týmto textom v ľubovoľnom stĺpci",
    findsPhrase: "Úvodzovky držia slová pokope",
    findsText: "{column} obsahuje text",
    findsOptions: "{column} je jedna z uvedených hodnôt",
    findsBoolean: "{column} je áno alebo nie",
    findsNumber: "{column} porovnané pomocou > >= < <= alebo rozsah a..b",
    findsDate:
      "{column} v roku, mesiaci alebo dni, pred < alebo po >, v rozsahu a..b, alebo last30d, thismonth",
    findsNoValue: "{column} nemá hodnotu",
    helpFooter:
      "Kľúče a hodnoty nerozlišujú veľkosť písmen. Oddeľte hodnoty čiarkami, aby ste našli ktorúkoľvek z nich.",
    typeText: "Text",
    typeNumber: "Číslo",
    typeDate: "Dátum",
    typeBoolean: "Áno alebo nie",
    typeOptions: "Možnosti",
    columnsGroup: "Filtrovať podľa stĺpca",
    matchingGroup: "Zodpovedajúce hodnoty",
    compareGroup: "Porovnať",
    presetsGroup: "Predvoľby",
    yearsGroup: "Roky",
    monthsGroup: "Mesiace",
    dataRange: "Tu od {min} do {max}",
    equalTo: "Rovná sa",
    moreThan: "Viac ako",
    atLeast: "Aspoň",
    lessThan: "Menej ako",
    atMost: "Najviac",
    between: "Medzi",
    before: "Pred",
    after: "Po",
    presetToday: "Dnes",
    presetYesterday: "Včera",
    presetThisMonth: "Tento mesiac",
    presetLastMonth: "Minulý mesiac",
    presetThisYear: "Tento rok",
    presetLastYear: "Minulý rok",
    presetLastDays: {
      one: "Posledný {count} deň",
      few: "Posledné {count} dni",
      many: "Posledných {count} dňa",
      other: "Posledných {count} dní",
    },
    presetLastWeeks: {
      one: "Posledný {count} týždeň",
      few: "Posledné {count} týždne",
      many: "Posledných {count} týždňa",
      other: "Posledných {count} týždňov",
    },
    presetLastMonths: {
      one: "Posledný {count} mesiac",
      few: "Posledné {count} mesiace",
      many: "Posledných {count} mesiaca",
      other: "Posledných {count} mesiacov",
    },
    presetLastYears: {
      one: "Posledný {count} rok",
      few: "Posledné {count} roky",
      many: "Posledných {count} roka",
      other: "Posledných {count} rokov",
    },
    pickDates: "Vybrať dátumy v kalendári",
    pickDay: "Vybrať deň v kalendári",
    calendarRange: "Vyberte deň alebo začiatok a koniec",
    calendarBefore: "Pred vybraným dňom",
    calendarAfter: "Po vybranom dni",
    calendarOnOrBefore: "Do vybraného dňa vrátane",
    calendarOnOrAfter: "Od vybraného dňa vrátane",
    keyMove: "Presunúť",
    keySelect: "Vybrať",
    keyComplete: "Doplniť",
    keyClose: "Zavrieť",
    summaryFilters: "Filtre: {filters}.",
    summaryNoFilters: "Žiadne filtre.",
    summarySearch: "Hľadanie: {search}.",
    summaryProblems: {
      one: "{count} problém: {problems}",
      few: "{count} problémy: {problems}",
      many: "{count} problému: {problems}",
      other: "{count} problémov: {problems}",
    },
    unknownColumn: "Žiadny stĺpec sa nevolá „{key}“.",
    unknownColumnSuggestion:
      "Žiadny stĺpec sa nevolá „{key}“. Mali ste na mysli {suggestion}?",
    columnNotFilterable: "Stĺpec {column} nemožno filtrovať.",
    unknownValue: "{column} nemá hodnotu „{value}“.",
    unknownValueSuggestion:
      "{column} nemá hodnotu „{value}“. Mali ste na mysli {suggestion}?",
    notANumber: "„{value}“ nie je číslo.",
    badDate: "„{value}“ nie je dátum.",
    ambiguousNoYear: "„{value}“ potrebuje rok, napríklad 2015-06-30.",
    ambiguousTwoDigitYear:
      "Napíšte celý rok: „{value}“ môže patriť do viacerých storočí.",
    ambiguousMonth: "„{value}“ môže byť viac mesiacov: napíšte viac z názvu.",
    backwardsRange: "Tento rozsah začína po svojom konci: {from} je po {to}.",
    unsupportedOr:
      "OR nie je podporované. Riadky musia spĺňať každú podmienku. Ak chcete nájsť jednu z viacerých hodnôt stĺpca, napíšte ich oddelené čiarkami: {example}",
    unsupportedOrNoList:
      "OR nie je podporované. Riadky musia spĺňať každú podmienku, preto hľadajte jednu vec naraz.",
    unsupportedMinus:
      "Vylučovanie nie je podporované, preto sa táto podmienka nepoužije. Ak chcete hľadať presne tento text, dajte ho do úvodzoviek. Ak chcete zúžiť riadky, filtrujte radšej hodnoty, ktoré chcete ponechať: {example}",
    unsupportedMinusNoFilter:
      "Vylučovanie nie je podporované, preto sa táto podmienka nepoužije. Ak chcete hľadať presne tento text, dajte ho do úvodzoviek.",
    exclusiveComparison: "Pri dátume s časom použite >= alebo <=.",
    notComparable: "Stĺpec {column} nemá poradie: vyberte radšej jeho hodnoty.",
    multipleBoolean: "{column} je áno alebo nie, nie oboje.",
    multipleDates:
      "{column} prijíma jeden dátum alebo jeden rozsah, napríklad 2015..2016.",
    duplicateNoMatch:
      "Žiadny riadok nemôže splniť obe podmienky pre stĺpec {column}.",
    duplicateNotCombinable:
      "Stĺpec {column} je už filtrovaný skôr v hľadaní: spojte oboje do jednej podmienky.",
  },
})
