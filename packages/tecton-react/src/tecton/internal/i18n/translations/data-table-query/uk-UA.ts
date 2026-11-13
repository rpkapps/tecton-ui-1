/**
 * uk-UA strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Вводьте умови поруч: застосовуються всі. Умова — це текст для пошуку або стовпець і його значення. Виберіть приклад, щоб додати його.",
    helpExample: "Приклад",
    helpFinds: "Знаходить",
    findsWords: "Рядки з цим текстом у будь-якому стовпці",
    findsPhrase: "Лапки об’єднують слова",
    findsText: "{column} містить текст",
    findsOptions: "{column} — одне з наведених значень",
    findsBoolean: "{column} — так або ні",
    findsNumber: "{column} у порівнянні > >= < <= або діапазон a..b",
    findsDate:
      "{column} у році, місяці чи дні, до < або після >, у діапазоні a..b, або last30d, thismonth",
    findsNoValue: "{column} без значення",
    helpFooter:
      "Регістр у ключах і значеннях не важливий. Розділяйте значення комами, щоб знайти будь-яке з них.",
    typeText: "Текст",
    typeNumber: "Число",
    typeDate: "Дата",
    typeBoolean: "Так або ні",
    typeOptions: "Варіанти",
    columnsGroup: "Фільтр за стовпцем",
    matchingGroup: "Відповідні значення",
    compareGroup: "Порівняння",
    presetsGroup: "Набори",
    yearsGroup: "Роки",
    monthsGroup: "Місяці",
    dataRange: "Тут від {min} до {max}",
    moreThan: "Більше",
    atLeast: "Не менше",
    lessThan: "Менше",
    atMost: "Не більше",
    between: "Між",
    before: "До",
    after: "Після",
    presetToday: "Сьогодні",
    presetYesterday: "Учора",
    presetThisMonth: "Цей місяць",
    presetLastMonth: "Минулий місяць",
    presetThisYear: "Цей рік",
    presetLastYear: "Минулий рік",
    presetLastDays: {
      one: "Останній {count} день",
      few: "Останні {count} дні",
      many: "Останні {count} днів",
      other: "Останні {count} дня",
    },
    presetLastWeeks: {
      one: "Останній {count} тиждень",
      few: "Останні {count} тижні",
      many: "Останні {count} тижнів",
      other: "Останні {count} тижня",
    },
    presetLastMonths: {
      one: "Останній {count} місяць",
      few: "Останні {count} місяці",
      many: "Останні {count} місяців",
      other: "Останні {count} місяця",
    },
    presetLastYears: {
      one: "Останній {count} рік",
      few: "Останні {count} роки",
      many: "Останні {count} років",
      other: "Останні {count} року",
    },
    pickDates: "Вибрати дати в календарі",
    pickDay: "Вибрати день у календарі",
    calendarRange: "Виберіть день або початок і кінець",
    calendarBefore: "До вибраного дня",
    calendarAfter: "Після вибраного дня",
    calendarOnOrBefore: "До вибраного дня включно",
    calendarOnOrAfter: "З вибраного дня включно",
    keyMove: "Перейти",
    keySelect: "Вибрати",
    keyComplete: "Доповнити",
    keyClose: "Закрити",
    footerAll: "Умови поруч застосовуються всі",
    summaryFilters: "Фільтри: {filters}.",
    summaryNoFilters: "Фільтрів немає.",
    summarySearch: "Пошук: {search}.",
    summaryProblems: {
      one: "{count} проблема: {problems}",
      few: "{count} проблеми: {problems}",
      many: "{count} проблем: {problems}",
      other: "{count} проблеми: {problems}",
    },
    unknownColumn: "Стовпця «{key}» немає.",
    unknownColumnSuggestion:
      "Стовпця «{key}» немає. Можливо, ви мали на увазі {suggestion}?",
    columnNotFilterable: "Стовпець {column} не можна фільтрувати.",
    unknownValue: "У стовпці {column} немає значення «{value}».",
    unknownValueSuggestion:
      "У стовпці {column} немає значення «{value}». Можливо, ви мали на увазі {suggestion}?",
    notANumber: "«{value}» — не число.",
    badDate: "«{value}» — не дата.",
    ambiguousNoYear: "Для «{value}» потрібен рік, наприклад 2015-06-30.",
    ambiguousTwoDigitYear:
      "Вкажіть рік повністю: «{value}» може стосуватися різних століть.",
    ambiguousMonth:
      "«{value}» може означати кілька місяців: напишіть назву докладніше.",
    backwardsRange:
      "Діапазон починається після свого кінця: {from} пізніше за {to}.",
    unsupportedOr:
      "OR не підтримується: застосовуються всі умови. Щоб знайти будь-яке з кількох значень, розділіть їх комами.",
    unsupportedNot:
      "Виключення не підтримується: відфільтруйте значення, які треба залишити. Щоб знайти цей текст, візьміть його в лапки.",
    exclusiveComparison: "Для дати з часом використовуйте >= або <=.",
    notComparable: "Стовпець {column} не має порядку: виберіть його значення.",
    multipleBoolean: "{column} — так або ні, але не обидва.",
    multipleDates:
      "{column} приймає одну дату або один діапазон, наприклад 2015..2016.",
    duplicateNoMatch:
      "Жоден рядок не може задовольнити обидві умови для стовпця {column}.",
    duplicateNotCombinable:
      "Стовпець {column} уже відфільтровано раніше в пошуку: об’єднайте обидві в одну умову.",
  },
})
