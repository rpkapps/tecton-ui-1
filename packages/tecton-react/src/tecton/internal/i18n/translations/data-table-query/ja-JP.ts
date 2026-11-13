/**
 * ja-JP strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "条件を並べて入力します。すべての条件が適用されます。条件は検索するテキスト、または列とその値です。例を選ぶと追加されます。",
    helpExample: "例",
    helpFinds: "検索対象",
    findsWords: "いずれかの列にこのテキストがある行",
    findsPhrase: "引用符で単語をまとめる",
    findsText: "{column} がテキストを含む",
    findsOptions: "{column} が一覧の値のいずれか",
    findsBoolean: "{column} がはいまたはいいえ",
    findsNumber: "{column} を > >= < <= で比較、または範囲 a..b",
    findsDate:
      "{column} が年・月・日、前 < または後 >、範囲 a..b、または last30d、thismonth",
    findsNoValue: "{column} に値がない",
    helpFooter:
      "キーと値は大文字と小文字を区別しません。値をカンマで区切ると、いずれかに一致します。",
    typeText: "テキスト",
    typeNumber: "数値",
    typeDate: "日付",
    typeBoolean: "はい/いいえ",
    typeOptions: "選択肢",
    columnsGroup: "列で絞り込む",
    matchingGroup: "一致する値",
    compareGroup: "比較",
    presetsGroup: "プリセット",
    yearsGroup: "年",
    monthsGroup: "月",
    dataRange: "ここでは {min}〜{max}",
    moreThan: "より大きい",
    atLeast: "以上",
    lessThan: "より小さい",
    atMost: "以下",
    between: "範囲",
    before: "より前",
    after: "より後",
    presetToday: "今日",
    presetYesterday: "昨日",
    presetThisMonth: "今月",
    presetLastMonth: "先月",
    presetThisYear: "今年",
    presetLastYear: "昨年",
    presetLastDays: { other: "過去 {count} 日" },
    presetLastWeeks: { other: "過去 {count} 週間" },
    presetLastMonths: { other: "過去 {count} か月" },
    presetLastYears: { other: "過去 {count} 年" },
    pickDates: "カレンダーで日付を選ぶ",
    pickDay: "カレンダーで日を選ぶ",
    calendarRange: "日、または開始日と終了日を選んでください",
    calendarBefore: "選んだ日より前",
    calendarAfter: "選んだ日より後",
    calendarOnOrBefore: "選んだ日以前",
    calendarOnOrAfter: "選んだ日以降",
    keyMove: "移動",
    keySelect: "選択",
    keyComplete: "補完",
    keyClose: "閉じる",
    summaryFilters: "フィルター: {filters}。",
    summaryNoFilters: "フィルターなし。",
    summarySearch: "検索: {search}。",
    summaryProblems: { other: "{count} 件の問題: {problems}" },
    unknownColumn: "「{key}」という列はありません。",
    unknownColumnSuggestion:
      "「{key}」という列はありません。{suggestion} ですか?",
    columnNotFilterable: "{column} は絞り込めません。",
    unknownValue: "{column} に値「{value}」はありません。",
    unknownValueSuggestion:
      "{column} に値「{value}」はありません。{suggestion} ですか?",
    notANumber: "「{value}」は数値ではありません。",
    badDate: "「{value}」は日付ではありません。",
    ambiguousNoYear: "「{value}」には年が必要です(例: 2015-06-30)。",
    ambiguousTwoDigitYear:
      "年を省略せずに書いてください。「{value}」は複数の世紀に当てはまります。",
    ambiguousMonth:
      "「{value}」は複数の月に当てはまります。名前をもっと入力してください。",
    backwardsRange:
      "この範囲は終わりより後に始まっています: {from} は {to} より後です。",
    unsupportedOr:
      "OR は使えません。行はすべての条件に一致する必要があります。列の複数の値のいずれかに一致させるには、値をカンマで区切って並べてください。例: {example}",
    unsupportedOrNoList:
      "OR は使えません。行はすべての条件に一致する必要があるため、一度に 1 つずつ検索してください。",
    unsupportedMinus:
      "除外は使えないため、この条件は無視されます。このテキストそのものを検索するには引用符で囲んでください。行を絞り込むには、代わりに残す値を指定してください。例: {example}",
    unsupportedMinusNoFilter:
      "除外は使えないため、この条件は無視されます。このテキストそのものを検索するには引用符で囲んでください。",
    unsupportedNot:
      "除外は使えないため、NOT は無視され、前後の条件はそのまま適用されます。行を絞り込むには、代わりに残す値を指定してください。例: {example}",
    unsupportedNotNoFilter:
      "除外は使えないため、NOT は無視され、前後の条件はそのまま適用されます。",
    exclusiveComparison: "日時には >= または <= を使ってください。",
    notComparable:
      "{column} には順序がありません。代わりに値を選んでください。",
    multipleBoolean: "{column} ははいかいいえのどちらかです。",
    multipleDates:
      "{column} には日付または範囲を 1 つ指定します(例: 2015..2016)。",
    duplicateNoMatch: "{column} の両方の条件に一致する行はありません。",
    duplicateNotCombinable:
      "{column} は検索の前の方で既に絞り込まれています。両方を 1 つの条件にまとめてください。",
  },
})
