/**
 * cs-CZ strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Zadávejte podmínky vedle sebe: platí všechny. Podmínka je text k vyhledání, nebo sloupec a jeho hodnoty. Výběrem příkladu ho přidáte.",
    helpExample: "Příklad",
    helpFinds: "Najde",
    findsWords: "Řádky s tímto textem v libovolném sloupci",
    findsPhrase: "Uvozovky drží slova pohromadě",
    findsText: "{column} obsahuje text",
    findsOptions: "{column} je jedna z uvedených hodnot",
    findsBoolean: "{column} je ano nebo ne",
    findsNumber: "{column} porovnáno pomocí > >= < <= nebo rozsah a..b",
    findsDate:
      "{column} v roce, měsíci nebo dni, před < nebo po >, v rozsahu a..b, nebo last30d, thismonth",
    findsNoValue: "{column} nemá hodnotu",
    helpFooter:
      "Klíče a hodnoty nerozlišují velikost písmen. Oddělte hodnoty čárkami, abyste našli kteroukoli z nich.",
    typeText: "Text",
    typeNumber: "Číslo",
    typeDate: "Datum",
    typeBoolean: "Ano nebo ne",
    typeOptions: "Možnosti",
    columnsGroup: "Filtrovat podle sloupce",
    matchingGroup: "Odpovídající hodnoty",
    compareGroup: "Porovnat",
    presetsGroup: "Předvolby",
    yearsGroup: "Roky",
    monthsGroup: "Měsíce",
    dataRange: "Zde od {min} do {max}",
    equalTo: "Rovná se",
    moreThan: "Více než",
    atLeast: "Alespoň",
    lessThan: "Méně než",
    atMost: "Nejvýše",
    between: "Mezi",
    before: "Před",
    after: "Po",
    presetToday: "Dnes",
    presetYesterday: "Včera",
    presetThisMonth: "Tento měsíc",
    presetLastMonth: "Minulý měsíc",
    presetThisYear: "Tento rok",
    presetLastYear: "Minulý rok",
    presetLastDays: {
      one: "Poslední {count} den",
      few: "Poslední {count} dny",
      many: "Posledních {count} dne",
      other: "Posledních {count} dní",
    },
    presetLastWeeks: {
      one: "Poslední {count} týden",
      few: "Poslední {count} týdny",
      many: "Posledních {count} týdne",
      other: "Posledních {count} týdnů",
    },
    presetLastMonths: {
      one: "Poslední {count} měsíc",
      few: "Poslední {count} měsíce",
      many: "Posledních {count} měsíce",
      other: "Posledních {count} měsíců",
    },
    presetLastYears: {
      one: "Poslední {count} rok",
      few: "Poslední {count} roky",
      many: "Posledních {count} roku",
      other: "Posledních {count} let",
    },
    pickDates: "Vybrat data v kalendáři",
    pickDay: "Vybrat den v kalendáři",
    calendarRange: "Vyberte den, nebo začátek a konec",
    calendarBefore: "Před vybraným dnem",
    calendarAfter: "Po vybraném dni",
    calendarOnOrBefore: "Do vybraného dne včetně",
    calendarOnOrAfter: "Od vybraného dne včetně",
    keyMove: "Přesunout",
    keySelect: "Vybrat",
    keyComplete: "Doplnit",
    keyClose: "Zavřít",
    summaryFilters: "Filtry: {filters}.",
    summaryNoFilters: "Žádné filtry.",
    summarySearch: "Hledání: {search}.",
    summaryProblems: {
      one: "{count} problém: {problems}",
      few: "{count} problémy: {problems}",
      many: "{count} problému: {problems}",
      other: "{count} problémů: {problems}",
    },
    unknownColumn: "Žádný sloupec se nejmenuje „{key}“.",
    unknownColumnSuggestion:
      "Žádný sloupec se nejmenuje „{key}“. Měli jste na mysli {suggestion}?",
    columnNotFilterable: "Sloupec {column} nelze filtrovat.",
    unknownValue: "{column} nemá hodnotu „{value}“.",
    unknownValueSuggestion:
      "{column} nemá hodnotu „{value}“. Měli jste na mysli {suggestion}?",
    notANumber: "„{value}“ není číslo.",
    badDate: "„{value}“ není datum.",
    ambiguousNoYear: "„{value}“ potřebuje rok, například 2015-06-30.",
    ambiguousTwoDigitYear:
      "Napište celý rok: „{value}“ může spadat do více století.",
    ambiguousMonth: "„{value}“ může být více měsíců: napište víc z názvu.",
    backwardsRange: "Tento rozsah začíná po svém konci: {from} je po {to}.",
    unsupportedOr:
      "OR není podporováno. Řádky musí splňovat všechny podmínky. Chcete-li najít jednu z více hodnot sloupce, napište je oddělené čárkami: {example}",
    unsupportedOrNoList:
      "OR není podporováno. Řádky musí splňovat všechny podmínky, proto hledejte jednu věc po druhé.",
    unsupportedMinus:
      "Vylučování není podporováno, proto se tato podmínka nepoužije. Chcete-li hledat přímo tento text, dejte ho do uvozovek. Chcete-li zúžit řádky, filtrujte raději hodnoty, které chcete ponechat: {example}",
    unsupportedMinusNoFilter:
      "Vylučování není podporováno, proto se tato podmínka nepoužije. Chcete-li hledat přímo tento text, dejte ho do uvozovek.",
    exclusiveComparison: "U data s časem použijte >= nebo <=.",
    notComparable: "Sloupec {column} nemá pořadí: vyberte raději jeho hodnoty.",
    multipleBoolean: "{column} je ano nebo ne, ne obojí.",
    multipleDates:
      "{column} přijímá jedno datum nebo jeden rozsah, například 2015..2016.",
    duplicateNoMatch:
      "Žádný řádek nemůže splnit obě podmínky pro sloupec {column}.",
    duplicateNotCombinable:
      "Sloupec {column} je už filtrován dříve v hledání: spojte obojí do jedné podmínky.",
  },
})
