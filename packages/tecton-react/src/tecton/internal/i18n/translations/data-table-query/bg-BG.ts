/**
 * bg-BG strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Въвеждайте условия едно до друго: прилагат се всички. Условието е текст за търсене или колона и нейните стойности. Изберете пример, за да го добавите.",
    helpExample: "Пример",
    helpFinds: "Намира",
    findsWords: "Редове с този текст в коя да е колона",
    findsPhrase: "Кавичките държат думите заедно",
    findsText: "{column} съдържа текста",
    findsOptions: "{column} е една от изброените стойности",
    findsBoolean: "{column} е да или не",
    findsNumber: "{column} в сравнение > >= < <= или диапазон a..b",
    findsDate:
      "{column} в година, месец или ден, преди < или след >, в диапазон a..b, или last30d, thismonth",
    findsNoValue: "{column} няма стойност",
    helpFooter:
      "Ключовете и стойностите не различават главни и малки букви. Разделяйте стойностите със запетаи, за да намерите която и да е от тях.",
    typeText: "Текст",
    typeNumber: "Число",
    typeDate: "Дата",
    typeBoolean: "Да или не",
    typeOptions: "Опции",
    columnsGroup: "Филтриране по колона",
    matchingGroup: "Съвпадащи стойности",
    compareGroup: "Сравняване",
    presetsGroup: "Предварителни настройки",
    yearsGroup: "Години",
    monthsGroup: "Месеци",
    dataRange: "Тук от {min} до {max}",
    equalTo: "Равно на",
    moreThan: "Повече от",
    atLeast: "Поне",
    lessThan: "По-малко от",
    atMost: "Най-много",
    between: "Между",
    before: "Преди",
    after: "След",
    presetToday: "Днес",
    presetYesterday: "Вчера",
    presetThisMonth: "Този месец",
    presetLastMonth: "Миналия месец",
    presetThisYear: "Тази година",
    presetLastYear: "Миналата година",
    presetLastDays: {
      one: "Последният {count} ден",
      other: "Последните {count} дни",
    },
    presetLastWeeks: {
      one: "Последната {count} седмица",
      other: "Последните {count} седмици",
    },
    presetLastMonths: {
      one: "Последният {count} месец",
      other: "Последните {count} месеца",
    },
    presetLastYears: {
      one: "Последната {count} година",
      other: "Последните {count} години",
    },
    pickDates: "Изберете дати в календара",
    pickDay: "Изберете ден в календара",
    calendarRange: "Изберете ден или начало и край",
    calendarBefore: "Преди избрания ден",
    calendarAfter: "След избрания ден",
    calendarOnOrBefore: "До избрания ден включително",
    calendarOnOrAfter: "От избрания ден включително",
    keyMove: "Преместване",
    keySelect: "Избор",
    keyComplete: "Допълване",
    keyClose: "Затваряне",
    summaryFilters: "Филтри: {filters}.",
    summaryNoFilters: "Няма филтри.",
    summarySearch: "Търсене: {search}.",
    summaryProblems: {
      one: "{count} проблем: {problems}",
      other: "{count} проблема: {problems}",
    },
    unknownColumn: "Няма колона „{key}“.",
    unknownColumnSuggestion:
      "Няма колона „{key}“. Имахте предвид {suggestion}?",
    columnNotFilterable: "Колоната {column} не може да се филтрира.",
    unknownValue: "{column} няма стойност „{value}“.",
    unknownValueSuggestion:
      "{column} няма стойност „{value}“. Имахте предвид {suggestion}?",
    notANumber: "„{value}“ не е число.",
    badDate: "„{value}“ не е дата.",
    ambiguousNoYear: "„{value}“ се нуждае от година, например 2015-06-30.",
    ambiguousTwoDigitYear:
      "Напишете годината изцяло: „{value}“ може да е в повече от един век.",
    ambiguousMonth:
      "„{value}“ може да е повече от един месец: напишете повече от името.",
    backwardsRange: "Този диапазон започва след края си: {from} е след {to}.",
    unsupportedOr:
      "OR не се поддържа. Редовете трябва да отговарят на всяко условие. За да намерите една от няколко стойности на колона, изредете ги със запетаи: {example}",
    unsupportedOrNoList:
      "OR не се поддържа. Редовете трябва да отговарят на всяко условие, затова търсете едно нещо наведнъж.",
    unsupportedMinus:
      "Изключването не се поддържа, затова това условие се пропуска. За да търсите самия текст, поставете го в кавички. За да стесните редовете, филтрирайте вместо това стойностите, които да останат: {example}",
    unsupportedMinusNoFilter:
      "Изключването не се поддържа, затова това условие се пропуска. За да търсите самия текст, поставете го в кавички.",
    exclusiveComparison: "За дата и час използвайте >= или <=.",
    notComparable: "{column} няма подредба: изберете стойностите ѝ.",
    multipleBoolean: "{column} е да или не, не и двете.",
    multipleDates:
      "{column} приема една дата или един диапазон, например 2015..2016.",
    duplicateNoMatch:
      "Нито един ред не може да изпълни и двете условия за {column}.",
    duplicateNotCombinable:
      "{column} вече се филтрира по-рано в търсенето: обединете двете в едно условие.",
  },
})
