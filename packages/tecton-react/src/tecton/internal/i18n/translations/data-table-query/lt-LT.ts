/**
 * lt-LT strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Rašykite sąlygas vieną šalia kitos: taikomos visos. Sąlyga yra ieškomas tekstas arba stulpelis ir jo reikšmės. Pasirinkite pavyzdį, kad jį pridėtumėte.",
    helpExample: "Pavyzdys",
    helpFinds: "Randa",
    findsWords: "Eilutės su šiuo tekstu bet kuriame stulpelyje",
    findsPhrase: "Kabutės sujungia žodžius",
    findsText: "{column} turi tekstą",
    findsOptions: "{column} yra viena iš išvardytų reikšmių",
    findsBoolean: "{column} yra taip arba ne",
    findsNumber: "{column} palyginta su > >= < <= arba intervalas a..b",
    findsDate:
      "{column} metais, mėnesį ar dieną, prieš < arba po >, intervale a..b, arba last30d, thismonth",
    findsNoValue: "{column} neturi reikšmės",
    helpFooter:
      "Raktai ir reikšmės neskiria didžiųjų ir mažųjų raidžių. Atskirkite reikšmes kableliais, kad rastumėte bet kurią iš jų.",
    typeText: "Tekstas",
    typeNumber: "Skaičius",
    typeDate: "Data",
    typeBoolean: "Taip arba ne",
    typeOptions: "Parinktys",
    columnsGroup: "Filtruoti pagal stulpelį",
    matchingGroup: "Atitinkančios reikšmės",
    compareGroup: "Palyginti",
    presetsGroup: "Išankstiniai nustatymai",
    yearsGroup: "Metai",
    monthsGroup: "Mėnesiai",
    dataRange: "Čia nuo {min} iki {max}",
    moreThan: "Daugiau nei",
    atLeast: "Bent",
    lessThan: "Mažiau nei",
    atMost: "Daugiausia",
    between: "Tarp",
    before: "Prieš",
    after: "Po",
    presetToday: "Šiandien",
    presetYesterday: "Vakar",
    presetThisMonth: "Šis mėnuo",
    presetLastMonth: "Praėjęs mėnuo",
    presetThisYear: "Šie metai",
    presetLastYear: "Praėję metai",
    presetLastDays: {
      one: "Paskutinė {count} diena",
      few: "Paskutinės {count} dienos",
      many: "Paskutinės {count} dienos",
      other: "Paskutinių {count} dienų",
    },
    presetLastWeeks: {
      one: "Paskutinė {count} savaitė",
      few: "Paskutinės {count} savaitės",
      many: "Paskutinės {count} savaitės",
      other: "Paskutinių {count} savaičių",
    },
    presetLastMonths: {
      one: "Paskutinis {count} mėnuo",
      few: "Paskutiniai {count} mėnesiai",
      many: "Paskutinio {count} mėnesio",
      other: "Paskutinių {count} mėnesių",
    },
    presetLastYears: {
      one: "Paskutiniai {count} metai",
      few: "Paskutiniai {count} metai",
      many: "Paskutinių {count} metų",
      other: "Paskutinių {count} metų",
    },
    pickDates: "Pasirinkti datas kalendoriuje",
    pickDay: "Pasirinkti dieną kalendoriuje",
    calendarRange: "Pasirinkite dieną arba pradžią ir pabaigą",
    calendarBefore: "Prieš pasirinktą dieną",
    calendarAfter: "Po pasirinktos dienos",
    calendarOnOrBefore: "Iki pasirinktos dienos imtinai",
    calendarOnOrAfter: "Nuo pasirinktos dienos imtinai",
    keyMove: "Perkelti",
    keySelect: "Pasirinkti",
    keyComplete: "Užbaigti",
    keyClose: "Uždaryti",
    summaryFilters: "Filtrai: {filters}.",
    summaryNoFilters: "Filtrų nėra.",
    summarySearch: "Paieška: {search}.",
    summaryProblems: {
      one: "{count} problema: {problems}",
      few: "{count} problemos: {problems}",
      many: "{count} problemos: {problems}",
      other: "{count} problemų: {problems}",
    },
    unknownColumn: "Stulpelio „{key}“ nėra.",
    unknownColumnSuggestion:
      "Stulpelio „{key}“ nėra. Ar turėjote omenyje {suggestion}?",
    columnNotFilterable: "Stulpelio {column} negalima filtruoti.",
    unknownValue: "{column} neturi reikšmės „{value}“.",
    unknownValueSuggestion:
      "{column} neturi reikšmės „{value}“. Ar turėjote omenyje {suggestion}?",
    notANumber: "„{value}“ nėra skaičius.",
    badDate: "„{value}“ nėra data.",
    ambiguousNoYear: "„{value}“ reikia metų, pvz., 2015-06-30.",
    ambiguousTwoDigitYear:
      "Rašykite visus metus: „{value}“ gali būti daugiau nei viename amžiuje.",
    ambiguousMonth:
      "„{value}“ gali būti daugiau nei vienas mėnuo: parašykite daugiau pavadinimo.",
    backwardsRange: "Šis intervalas prasideda po pabaigos: {from} yra po {to}.",
    unsupportedOr:
      "OR nepalaikomas: taikomos visos sąlygos. Norėdami rasti bet kurią iš kelių reikšmių, atskirkite jas kableliais.",
    unsupportedNot:
      "Išskyrimas nepalaikomas: verčiau filtruokite reikšmes, kurias norite palikti. Norėdami ieškoti šio teksto, įrašykite jį į kabutes.",
    exclusiveComparison: "Su data ir laiku naudokite >= arba <=.",
    notComparable: "{column} neturi tvarkos: verčiau pasirinkite reikšmes.",
    multipleBoolean: "{column} yra taip arba ne, ne abu.",
    multipleDates:
      "{column} priima vieną datą arba vieną intervalą, pvz., 2015..2016.",
    duplicateNoMatch: "Nė viena eilutė negali atitikti abiejų {column} sąlygų.",
    duplicateNotCombinable:
      "{column} jau filtruojamas anksčiau paieškoje: sujunkite abi į vieną sąlygą.",
  },
})
