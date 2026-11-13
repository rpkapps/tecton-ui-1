/**
 * ru-RU strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Вводите условия рядом: применяются все. Условие — это текст для поиска или столбец и его значения. Выберите пример, чтобы добавить его.",
    helpExample: "Пример",
    helpFinds: "Находит",
    findsWords: "Строки с этим текстом в любом столбце",
    findsPhrase: "Кавычки объединяют слова",
    findsText: "{column} содержит текст",
    findsOptions: "{column} — одно из перечисленных значений",
    findsBoolean: "{column} — да или нет",
    findsNumber: "{column} в сравнении > >= < <= или диапазон a..b",
    findsDate:
      "{column} в году, месяце или дне, до < или после >, в диапазоне a..b, или last30d, thismonth",
    findsNoValue: "{column} без значения",
    helpFooter:
      "Регистр в ключах и значениях не важен. Разделяйте значения запятыми, чтобы найти любое из них.",
    typeText: "Текст",
    typeNumber: "Число",
    typeDate: "Дата",
    typeBoolean: "Да или нет",
    typeOptions: "Варианты",
    columnsGroup: "Фильтр по столбцу",
    matchingGroup: "Подходящие значения",
    compareGroup: "Сравнение",
    presetsGroup: "Наборы",
    yearsGroup: "Годы",
    monthsGroup: "Месяцы",
    dataRange: "Здесь от {min} до {max}",
    moreThan: "Больше",
    atLeast: "Не меньше",
    lessThan: "Меньше",
    atMost: "Не больше",
    between: "Между",
    before: "До",
    after: "После",
    presetToday: "Сегодня",
    presetYesterday: "Вчера",
    presetThisMonth: "Этот месяц",
    presetLastMonth: "Прошлый месяц",
    presetThisYear: "Этот год",
    presetLastYear: "Прошлый год",
    presetLastDays: {
      one: "Последний {count} день",
      few: "Последние {count} дня",
      many: "Последние {count} дней",
      other: "Последние {count} дня",
    },
    presetLastWeeks: {
      one: "Последняя {count} неделя",
      few: "Последние {count} недели",
      many: "Последние {count} недель",
      other: "Последние {count} недели",
    },
    presetLastMonths: {
      one: "Последний {count} месяц",
      few: "Последние {count} месяца",
      many: "Последние {count} месяцев",
      other: "Последние {count} месяца",
    },
    presetLastYears: {
      one: "Последний {count} год",
      few: "Последние {count} года",
      many: "Последние {count} лет",
      other: "Последние {count} года",
    },
    pickDates: "Выбрать даты в календаре",
    pickDay: "Выбрать день в календаре",
    calendarRange: "Выберите день или начало и конец",
    calendarBefore: "До выбранного дня",
    calendarAfter: "После выбранного дня",
    calendarOnOrBefore: "По выбранный день включительно",
    calendarOnOrAfter: "С выбранного дня включительно",
    keyMove: "Перейти",
    keySelect: "Выбрать",
    keyComplete: "Дополнить",
    keyClose: "Закрыть",
    footerAll: "Условия рядом применяются все",
    summaryFilters: "Фильтры: {filters}.",
    summaryNoFilters: "Фильтров нет.",
    summarySearch: "Поиск: {search}.",
    summaryProblems: {
      one: "{count} проблема: {problems}",
      few: "{count} проблемы: {problems}",
      many: "{count} проблем: {problems}",
      other: "{count} проблемы: {problems}",
    },
    unknownColumn: "Столбца «{key}» нет.",
    unknownColumnSuggestion:
      "Столбца «{key}» нет. Возможно, вы имели в виду {suggestion}?",
    columnNotFilterable: "Столбец {column} нельзя фильтровать.",
    unknownValue: "В столбце {column} нет значения «{value}».",
    unknownValueSuggestion:
      "В столбце {column} нет значения «{value}». Возможно, вы имели в виду {suggestion}?",
    notANumber: "«{value}» — не число.",
    badDate: "«{value}» — не дата.",
    ambiguousNoYear: "Для «{value}» нужен год, например 2015-06-30.",
    ambiguousTwoDigitYear:
      "Укажите год полностью: «{value}» может относиться к разным векам.",
    ambiguousMonth:
      "«{value}» может означать несколько месяцев: напишите название подробнее.",
    backwardsRange:
      "Диапазон начинается после своего конца: {from} позже {to}.",
    unsupportedOr:
      "OR не поддерживается: применяются все условия. Чтобы найти любое из нескольких значений, разделите их запятыми.",
    unsupportedNot:
      "Исключение не поддерживается: отфильтруйте значения, которые нужно оставить. Чтобы найти этот текст, заключите его в кавычки.",
    exclusiveComparison: "Для даты со временем используйте >= или <=.",
    notComparable: "У столбца {column} нет порядка: выберите его значения.",
    multipleBoolean: "{column} — да или нет, но не оба.",
    multipleDates:
      "{column} принимает одну дату или один диапазон, например 2015..2016.",
    duplicateNoMatch:
      "Ни одна строка не может удовлетворить оба условия по столбцу {column}.",
    duplicateNotCombinable:
      "Столбец {column} уже отфильтрован ранее в поиске: объедините оба в одно условие.",
  },
})
