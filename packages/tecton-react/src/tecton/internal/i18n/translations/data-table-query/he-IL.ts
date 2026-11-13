/**
 * he-IL strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "הקלידו תנאים זה לצד זה: כולם חלים. תנאי הוא טקסט לחיפוש או עמודה והערכים שלה. בחרו דוגמה כדי להוסיף אותה.",
    helpExample: "דוגמה",
    helpFinds: "מוצא",
    findsWords: "שורות עם הטקסט הזה בעמודה כלשהי",
    findsPhrase: "מירכאות שומרות על המילים יחד",
    findsText: "{column} מכיל את הטקסט",
    findsOptions: "{column} הוא אחד מהערכים ברשימה",
    findsBoolean: "{column} הוא כן או לא",
    findsNumber: "{column} בהשוואה > >= < <= או טווח a..b",
    findsDate:
      "{column} בשנה, בחודש או ביום, לפני < או אחרי >, בטווח a..b, או last30d, thismonth",
    findsNoValue: "ל־{column} אין ערך",
    helpFooter:
      "מפתחות וערכים אינם תלויי רישיות. הפרידו ערכים בפסיקים כדי למצוא כל אחד מהם.",
    typeText: "טקסט",
    typeNumber: "מספר",
    typeDate: "תאריך",
    typeBoolean: "כן או לא",
    typeOptions: "אפשרויות",
    columnsGroup: "סינון לפי עמודה",
    matchingGroup: "ערכים תואמים",
    compareGroup: "השוואה",
    presetsGroup: "הגדרות מוכנות",
    yearsGroup: "שנים",
    monthsGroup: "חודשים",
    dataRange: "כאן מ־{min} עד {max}",
    moreThan: "יותר מ־",
    atLeast: "לפחות",
    lessThan: "פחות מ־",
    atMost: "לכל היותר",
    between: "בין",
    before: "לפני",
    after: "אחרי",
    presetToday: "היום",
    presetYesterday: "אתמול",
    presetThisMonth: "החודש",
    presetLastMonth: "החודש שעבר",
    presetThisYear: "השנה",
    presetLastYear: "השנה שעברה",
    presetLastDays: {
      one: "היום האחרון",
      two: "{count} הימים האחרונים",
      other: "{count} הימים האחרונים",
    },
    presetLastWeeks: {
      one: "השבוע האחרון",
      two: "{count} השבועות האחרונים",
      other: "{count} השבועות האחרונים",
    },
    presetLastMonths: {
      one: "החודש האחרון",
      two: "{count} החודשים האחרונים",
      other: "{count} החודשים האחרונים",
    },
    presetLastYears: {
      one: "השנה האחרונה",
      two: "{count} השנים האחרונות",
      other: "{count} השנים האחרונות",
    },
    pickDates: "בחירת תאריכים בלוח השנה",
    pickDay: "בחירת יום בלוח השנה",
    calendarRange: "בחרו יום, או התחלה וסוף",
    calendarBefore: "לפני היום שתבחרו",
    calendarAfter: "אחרי היום שתבחרו",
    calendarOnOrBefore: "עד היום שתבחרו, כולל",
    calendarOnOrAfter: "מהיום שתבחרו, כולל",
    keyMove: "מעבר",
    keySelect: "בחירה",
    keyComplete: "השלמה",
    keyClose: "סגירה",
    summaryFilters: "מסננים: {filters}.",
    summaryNoFilters: "אין מסננים.",
    summarySearch: "חיפוש: {search}.",
    summaryProblems: {
      one: "בעיה אחת: {problems}",
      two: "{count} בעיות: {problems}",
      other: "{count} בעיות: {problems}",
    },
    unknownColumn: 'אין עמודה בשם "{key}".',
    unknownColumnSuggestion:
      'אין עמודה בשם "{key}". האם התכוונת ל־{suggestion}?',
    columnNotFilterable: "אי אפשר לסנן את {column}.",
    unknownValue: 'ל־{column} אין ערך "{value}".',
    unknownValueSuggestion:
      'ל־{column} אין ערך "{value}". האם התכוונת ל־{suggestion}?',
    notANumber: '"{value}" אינו מספר.',
    badDate: '"{value}" אינו תאריך.',
    ambiguousNoYear: 'ל־"{value}" חסרה שנה, למשל 2015-06-30.',
    ambiguousTwoDigitYear:
      'כתבו את השנה במלואה: "{value}" יכול להיות ביותר ממאה אחת.',
    ambiguousMonth: '"{value}" יכול להיות יותר מחודש אחד: כתבו יותר מהשם.',
    backwardsRange: "הטווח הזה מתחיל אחרי שהוא מסתיים: {from} אחרי {to}.",
    unsupportedOr:
      "OR אינו נתמך: כל התנאים חלים. כדי למצוא אחד מכמה ערכים, הפרידו ביניהם בפסיקים.",
    unsupportedNot:
      "החרגה אינה נתמכת: סננו במקום זאת לפי הערכים שנשארים. כדי לחפש את הטקסט הזה, שימו אותו במירכאות.",
    exclusiveComparison: "עם תאריך ושעה השתמשו ב־>= או ב־<=.",
    notComparable: "ל־{column} אין סדר: בחרו במקום זאת את הערכים שלה.",
    multipleBoolean: "{column} הוא כן או לא, לא שניהם.",
    multipleDates: "{column} מקבל תאריך אחד או טווח אחד, למשל 2015..2016.",
    duplicateNoMatch: "אף שורה לא יכולה לעמוד בשני התנאים על {column}.",
    duplicateNotCombinable:
      "{column} כבר מסונן מוקדם יותר בחיפוש: כתבו את שניהם בתנאי אחד.",
  },
})
