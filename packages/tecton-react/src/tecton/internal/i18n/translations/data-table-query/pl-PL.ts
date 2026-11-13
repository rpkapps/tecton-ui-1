/**
 * pl-PL strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Wpisuj warunki obok siebie: obowiązują wszystkie. Warunek to tekst do wyszukania albo kolumna i jej wartości. Wybierz przykład, aby go dodać.",
    helpExample: "Przykład",
    helpFinds: "Znajduje",
    findsWords: "Wiersze z tym tekstem w dowolnej kolumnie",
    findsPhrase: "Cudzysłów łączy słowa",
    findsText: "{column} zawiera tekst",
    findsOptions: "{column} ma jedną z wymienionych wartości",
    findsBoolean: "{column} to tak lub nie",
    findsNumber: "{column} porównane przez > >= < <= albo zakres a..b",
    findsDate:
      "{column} w roku, miesiącu lub dniu, przed < lub po >, w zakresie a..b, albo last30d, thismonth",
    findsNoValue: "{column} nie ma wartości",
    helpFooter:
      "Wielkość liter w kluczach i wartościach nie ma znaczenia. Oddziel wartości przecinkami, aby znaleźć dowolną z nich.",
    typeText: "Tekst",
    typeNumber: "Liczba",
    typeDate: "Data",
    typeBoolean: "Tak lub nie",
    typeOptions: "Opcje",
    columnsGroup: "Filtruj według kolumny",
    matchingGroup: "Pasujące wartości",
    compareGroup: "Porównaj",
    presetsGroup: "Gotowe zakresy",
    yearsGroup: "Lata",
    monthsGroup: "Miesiące",
    dataRange: "Tu od {min} do {max}",
    equalTo: "Równe",
    moreThan: "Więcej niż",
    atLeast: "Co najmniej",
    lessThan: "Mniej niż",
    atMost: "Co najwyżej",
    between: "Między",
    before: "Przed",
    after: "Po",
    presetToday: "Dzisiaj",
    presetYesterday: "Wczoraj",
    presetThisMonth: "Ten miesiąc",
    presetLastMonth: "Poprzedni miesiąc",
    presetThisYear: "Ten rok",
    presetLastYear: "Poprzedni rok",
    presetLastDays: {
      one: "Ostatni {count} dzień",
      few: "Ostatnie {count} dni",
      many: "Ostatnie {count} dni",
      other: "Ostatnie {count} dnia",
    },
    presetLastWeeks: {
      one: "Ostatni {count} tydzień",
      few: "Ostatnie {count} tygodnie",
      many: "Ostatnie {count} tygodni",
      other: "Ostatnie {count} tygodnia",
    },
    presetLastMonths: {
      one: "Ostatni {count} miesiąc",
      few: "Ostatnie {count} miesiące",
      many: "Ostatnie {count} miesięcy",
      other: "Ostatnie {count} miesiąca",
    },
    presetLastYears: {
      one: "Ostatni {count} rok",
      few: "Ostatnie {count} lata",
      many: "Ostatnie {count} lat",
      other: "Ostatnie {count} roku",
    },
    pickDates: "Wybierz daty w kalendarzu",
    pickDay: "Wybierz dzień w kalendarzu",
    calendarRange: "Wybierz dzień albo początek i koniec",
    calendarBefore: "Przed wybranym dniem",
    calendarAfter: "Po wybranym dniu",
    calendarOnOrBefore: "Do wybranego dnia włącznie",
    calendarOnOrAfter: "Od wybranego dnia włącznie",
    keyMove: "Przenieś",
    keySelect: "Wybierz",
    keyComplete: "Uzupełnij",
    keyClose: "Zamknij",
    summaryFilters: "Filtry: {filters}.",
    summaryNoFilters: "Brak filtrów.",
    summarySearch: "Wyszukiwanie: {search}.",
    summaryProblems: {
      one: "{count} problem: {problems}",
      few: "{count} problemy: {problems}",
      many: "{count} problemów: {problems}",
      other: "{count} problemu: {problems}",
    },
    unknownColumn: "Nie ma kolumny „{key}”.",
    unknownColumnSuggestion:
      "Nie ma kolumny „{key}”. Czy chodziło o {suggestion}?",
    columnNotFilterable: "Kolumny {column} nie można filtrować.",
    unknownValue: "Kolumna {column} nie ma wartości „{value}”.",
    unknownValueSuggestion:
      "Kolumna {column} nie ma wartości „{value}”. Czy chodziło o {suggestion}?",
    notANumber: "„{value}” nie jest liczbą.",
    badDate: "„{value}” nie jest datą.",
    ambiguousNoYear: "„{value}” wymaga roku, np. 2015-06-30.",
    ambiguousTwoDigitYear:
      "Wpisz pełny rok: „{value}” może należeć do więcej niż jednego wieku.",
    ambiguousMonth:
      "„{value}” może oznaczać więcej niż jeden miesiąc: wpisz więcej liter nazwy.",
    backwardsRange:
      "Ten zakres zaczyna się po swoim końcu: {from} jest po {to}.",
    unsupportedOr:
      "OR nie jest obsługiwane. Wiersze muszą spełniać każdy warunek. Aby znaleźć jedną z kilku wartości kolumny, wypisz je oddzielone przecinkami: {example}",
    unsupportedOrNoList:
      "OR nie jest obsługiwane. Wiersze muszą spełniać każdy warunek, więc szukaj jednej rzeczy naraz.",
    unsupportedMinus:
      "Wykluczanie nie jest obsługiwane, więc ten warunek jest pomijany. Aby wyszukać dokładnie ten tekst, ujmij go w cudzysłów. Aby zawęzić wiersze, odfiltruj zamiast tego wartości do zachowania: {example}",
    unsupportedMinusNoFilter:
      "Wykluczanie nie jest obsługiwane, więc ten warunek jest pomijany. Aby wyszukać dokładnie ten tekst, ujmij go w cudzysłów.",
    exclusiveComparison: "Dla daty z godziną użyj >= lub <=.",
    notComparable: "Kolumna {column} nie ma kolejności: wybierz jej wartości.",
    multipleBoolean: "{column} to tak lub nie, nie oba naraz.",
    multipleDates:
      "{column} przyjmuje jedną datę lub jeden zakres, np. 2015..2016.",
    duplicateNoMatch:
      "Żaden wiersz nie może spełnić obu warunków dla kolumny {column}.",
    duplicateNotCombinable:
      "Kolumna {column} jest już filtrowana wcześniej w wyszukiwaniu: połącz oba w jeden warunek.",
  },
})
