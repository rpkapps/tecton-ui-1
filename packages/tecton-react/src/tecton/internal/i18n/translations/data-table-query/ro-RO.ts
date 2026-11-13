/**
 * ro-RO strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Scrieți condițiile una lângă alta: se aplică toate. O condiție este un text de căutat sau o coloană și valorile ei. Alegeți un exemplu pentru a-l adăuga.",
    helpExample: "Exemplu",
    helpFinds: "Găsește",
    findsWords: "Rânduri cu acest text în orice coloană",
    findsPhrase: "Ghilimelele țin cuvintele împreună",
    findsText: "{column} conține textul",
    findsOptions: "{column} este una dintre valorile enumerate",
    findsBoolean: "{column} este da sau nu",
    findsNumber: "{column} comparat cu > >= < <= sau un interval a..b",
    findsDate:
      "{column} într-un an, o lună sau o zi, înainte < sau după >, într-un interval a..b, sau last30d, thismonth",
    findsNoValue: "{column} nu are valoare",
    helpFooter:
      "Cheile și valorile nu țin cont de majuscule. Separați valorile prin virgule pentru a găsi oricare dintre ele.",
    typeText: "Text",
    typeNumber: "Număr",
    typeDate: "Dată",
    typeBoolean: "Da sau nu",
    typeOptions: "Opțiuni",
    columnsGroup: "Filtrare după coloană",
    matchingGroup: "Valori potrivite",
    compareGroup: "Comparare",
    presetsGroup: "Presetări",
    yearsGroup: "Ani",
    monthsGroup: "Luni",
    dataRange: "Aici de la {min} la {max}",
    moreThan: "Mai mult de",
    atLeast: "Cel puțin",
    lessThan: "Mai puțin de",
    atMost: "Cel mult",
    between: "Între",
    before: "Înainte de",
    after: "După",
    presetToday: "Astăzi",
    presetYesterday: "Ieri",
    presetThisMonth: "Luna aceasta",
    presetLastMonth: "Luna trecută",
    presetThisYear: "Anul acesta",
    presetLastYear: "Anul trecut",
    presetLastDays: {
      one: "Ultima {count} zi",
      few: "Ultimele {count} zile",
      other: "Ultimele {count} de zile",
    },
    presetLastWeeks: {
      one: "Ultima {count} săptămână",
      few: "Ultimele {count} săptămâni",
      other: "Ultimele {count} de săptămâni",
    },
    presetLastMonths: {
      one: "Ultima {count} lună",
      few: "Ultimele {count} luni",
      other: "Ultimele {count} de luni",
    },
    presetLastYears: {
      one: "Ultimul {count} an",
      few: "Ultimii {count} ani",
      other: "Ultimii {count} de ani",
    },
    pickDates: "Alegeți date în calendar",
    pickDay: "Alegeți o zi în calendar",
    calendarRange: "Alegeți o zi sau un început și un sfârșit",
    calendarBefore: "Înainte de ziua aleasă",
    calendarAfter: "După ziua aleasă",
    calendarOnOrBefore: "Până la ziua aleasă inclusiv",
    calendarOnOrAfter: "De la ziua aleasă inclusiv",
    keyMove: "Mutare",
    keySelect: "Selectare",
    keyComplete: "Completare",
    keyClose: "Închidere",
    footerAll: "Condițiile alăturate se aplică toate",
    summaryFilters: "Filtre: {filters}.",
    summaryNoFilters: "Fără filtre.",
    summarySearch: "Căutare: {search}.",
    summaryProblems: {
      one: "{count} problemă: {problems}",
      few: "{count} probleme: {problems}",
      other: "{count} de probleme: {problems}",
    },
    unknownColumn: "Nicio coloană nu se numește „{key}”.",
    unknownColumnSuggestion:
      "Nicio coloană nu se numește „{key}”. Ați vrut să spuneți {suggestion}?",
    columnNotFilterable: "{column} nu poate fi filtrat.",
    unknownValue: "{column} nu are valoarea „{value}”.",
    unknownValueSuggestion:
      "{column} nu are valoarea „{value}”. Ați vrut să spuneți {suggestion}?",
    notANumber: "„{value}” nu este un număr.",
    badDate: "„{value}” nu este o dată.",
    ambiguousNoYear: "„{value}” are nevoie de un an, de exemplu 2015-06-30.",
    ambiguousTwoDigitYear:
      "Scrieți anul complet: „{value}” poate fi în mai multe secole.",
    ambiguousMonth:
      "„{value}” poate fi mai multe luni: scrieți mai mult din nume.",
    backwardsRange:
      "Acest interval începe după ce se termină: {from} este după {to}.",
    unsupportedOr:
      "OR nu este acceptat: se aplică toate condițiile. Pentru a găsi oricare dintre mai multe valori, separați-le prin virgule.",
    unsupportedNot:
      "Excluderea nu este acceptată: filtrați în schimb valorile de păstrat. Pentru a căuta acest text, puneți-l între ghilimele.",
    exclusiveComparison: "Cu dată și oră folosiți >= sau <=.",
    notComparable: "{column} nu are o ordine: alegeți în schimb valorile.",
    multipleBoolean: "{column} este da sau nu, nu ambele.",
    multipleDates:
      "{column} acceptă o dată sau un interval, de exemplu 2015..2016.",
    duplicateNoMatch:
      "Niciun rând nu poate îndeplini ambele condiții pentru {column}.",
    duplicateNotCombinable:
      "{column} este deja filtrat mai devreme în căutare: scrieți-le pe amândouă într-o singură condiție.",
  },
})
