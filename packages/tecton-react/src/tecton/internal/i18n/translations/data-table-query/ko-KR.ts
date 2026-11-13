/**
 * ko-KR strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "조건을 나란히 입력하세요. 모든 조건이 적용됩니다. 조건은 검색할 텍스트이거나 열과 그 값입니다. 예시를 선택하면 추가됩니다.",
    helpExample: "예시",
    helpFinds: "찾는 내용",
    findsWords: "어느 열에든 이 텍스트가 있는 행",
    findsPhrase: "따옴표로 단어를 묶음",
    findsText: "{column}에 텍스트 포함",
    findsOptions: "{column}이(가) 나열된 값 중 하나",
    findsBoolean: "{column}이(가) 예 또는 아니요",
    findsNumber: "{column}을(를) > >= < <=로 비교하거나 범위 a..b",
    findsDate:
      "{column}이(가) 연도, 월 또는 일, 이전 < 또는 이후 >, 범위 a..b, 또는 last30d, thismonth",
    findsNoValue: "{column}에 값 없음",
    helpFooter:
      "키와 값은 대소문자를 구분하지 않습니다. 값을 쉼표로 구분하면 그중 하나와 일치합니다.",
    typeText: "텍스트",
    typeNumber: "숫자",
    typeDate: "날짜",
    typeBoolean: "예 또는 아니요",
    typeOptions: "옵션",
    columnsGroup: "열로 필터링",
    matchingGroup: "일치하는 값",
    compareGroup: "비교",
    presetsGroup: "사전 설정",
    yearsGroup: "연도",
    monthsGroup: "월",
    dataRange: "여기서는 {min}~{max}",
    moreThan: "초과",
    atLeast: "이상",
    lessThan: "미만",
    atMost: "이하",
    between: "범위",
    before: "이전",
    after: "이후",
    presetToday: "오늘",
    presetYesterday: "어제",
    presetThisMonth: "이번 달",
    presetLastMonth: "지난달",
    presetThisYear: "올해",
    presetLastYear: "작년",
    presetLastDays: { other: "최근 {count}일" },
    presetLastWeeks: { other: "최근 {count}주" },
    presetLastMonths: { other: "최근 {count}개월" },
    presetLastYears: { other: "최근 {count}년" },
    pickDates: "달력에서 날짜 선택",
    pickDay: "달력에서 날짜 하나 선택",
    calendarRange: "날짜 하나 또는 시작일과 종료일을 선택하세요",
    calendarBefore: "선택한 날 이전",
    calendarAfter: "선택한 날 이후",
    calendarOnOrBefore: "선택한 날까지(포함)",
    calendarOnOrAfter: "선택한 날부터(포함)",
    keyMove: "이동",
    keySelect: "선택",
    keyComplete: "완성",
    keyClose: "닫기",
    summaryFilters: "필터: {filters}.",
    summaryNoFilters: "필터 없음.",
    summarySearch: "검색: {search}.",
    summaryProblems: { other: "문제 {count}개: {problems}" },
    unknownColumn: "“{key}”(이)라는 열이 없습니다.",
    unknownColumnSuggestion:
      "“{key}”(이)라는 열이 없습니다. {suggestion}을(를) 찾으셨나요?",
    columnNotFilterable: "{column}은(는) 필터링할 수 없습니다.",
    unknownValue: "{column}에 “{value}” 값이 없습니다.",
    unknownValueSuggestion:
      "{column}에 “{value}” 값이 없습니다. {suggestion}을(를) 찾으셨나요?",
    notANumber: "“{value}”은(는) 숫자가 아닙니다.",
    badDate: "“{value}”은(는) 날짜가 아닙니다.",
    ambiguousNoYear: "“{value}”에는 연도가 필요합니다(예: 2015-06-30).",
    ambiguousTwoDigitYear:
      "연도를 모두 쓰세요. “{value}”은(는) 여러 세기에 해당할 수 있습니다.",
    ambiguousMonth:
      "“{value}”은(는) 여러 달에 해당할 수 있습니다. 이름을 더 입력하세요.",
    backwardsRange:
      "이 범위는 끝난 뒤에 시작합니다. {from}이(가) {to}보다 뒤입니다.",
    unsupportedOr:
      "OR은 지원되지 않습니다. 행은 모든 조건과 일치해야 합니다. 열의 여러 값 중 하나와 일치시키려면 쉼표로 구분해 나열하세요: {example}",
    unsupportedOrNoList:
      "OR은 지원되지 않습니다. 행은 모든 조건과 일치해야 하므로 한 번에 하나씩 검색하세요.",
    unsupportedMinus:
      "제외는 지원되지 않으므로 이 조건은 무시됩니다. 텍스트 자체를 검색하려면 따옴표로 묶으세요. 행을 좁히려면 대신 남길 값으로 필터링하세요: {example}",
    unsupportedMinusNoFilter:
      "제외는 지원되지 않으므로 이 조건은 무시됩니다. 텍스트 자체를 검색하려면 따옴표로 묶으세요.",
    exclusiveComparison: "날짜와 시간에는 >= 또는 <=를 사용하세요.",
    notComparable: "{column}에는 순서가 없습니다. 대신 값을 선택하세요.",
    multipleBoolean: "{column}은(는) 예 또는 아니요 중 하나입니다.",
    multipleDates:
      "{column}에는 날짜 하나 또는 범위 하나를 지정합니다(예: 2015..2016).",
    duplicateNoMatch: "{column}의 두 조건을 모두 만족하는 행은 없습니다.",
    duplicateNotCombinable:
      "{column}은(는) 검색 앞부분에서 이미 필터링됩니다. 두 조건을 하나로 합치세요.",
  },
})
