/**
 * ko-KR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item}이(가) 선택되었습니다.",
    deselectedItem: "{item}이(가) 선택되지 않았습니다.",
    selectedCount: {
      "=0": "선택된 항목이 없습니다.",
      one: "{count}개 항목이 선택되었습니다.",
      other: "{count}개 항목이 선택되었습니다.",
    },
    selectedAll: "모든 항목이 선택되었습니다.",
  },
  chip: {
    removeButtonLabel: "제거",
    removeDescription: "태그를 제거하려면 Delete 키를 누르십시오.",
  },
  tree: {
    expand: "펼치기",
    collapse: "접기",
  },
  dragAndDrop: {
    dragItem: "{itemText} 드래그",
    dragStartedKeyboard:
      "드래그가 시작되었습니다. Tab을 눌러 드롭 대상으로 이동한 다음 Enter를 눌러 드롭하거나 Esc를 눌러 취소하세요.",
    dragStartedVirtual:
      "드래그가 시작되었습니다. 드롭 대상으로 이동한 다음 클릭하거나 Enter를 눌러 드롭하세요.",
    dropCanceled: "드롭이 취소되었습니다.",
    dropComplete: "드롭이 완료되었습니다.",
    dropOnItem: "{itemText}에 드롭",
    insertBefore: "{itemText} 이전에 삽입",
    insertBetween: "{beforeItemText} 및 {afterItemText} 사이에 삽입",
    insertAfter: "{itemText} 이후에 삽입",
  },
  table: {
    select: "선택",
    selectAll: "모두 선택",
    ascendingSort: "{columnName} 열을 기준으로 오름차순으로 정렬됨",
    descendingSort: "{columnName} 열을 기준으로 내림차순으로 정렬됨",
  },
  dataTable: {
    loading: "로드 중",
    emptyTitle: "행 없음",
    emptyDescription: "아직 표시할 항목이 없습니다.",
    noResultsTitle: "결과 없음",
    noResultsDescription: "검색 및 필터와 일치하는 행이 없습니다.",
    clearFilters: "필터 지우기",
    errorTitle: "행을 로드할 수 없습니다",
    errorDescription: "데이터를 로드하는 중에 문제가 발생했습니다.",
    retry: "다시 시도",
    rowsPerPage: "페이지당 행 수",
    pageInfo: "{pageCount}페이지 중 {page}페이지",
    pagination: "페이지 매기기",
    firstPage: "첫 페이지",
    previousPage: "이전 페이지",
    nextPage: "다음 페이지",
    lastPage: "마지막 페이지",
    selectedCount: {
      other: "{total}개 행 중 {selected}개 선택됨",
    },
    selectAllMatching: {
      other: "{total}개 행 모두 선택",
    },
    clearSelection: "선택 해제",
    rowsLoaded: { other: "{total}개 행 표시 중" },
    sortPositionAscending: "오름차순으로 정렬됨, 정렬 순서 {position}/{total}",
    sortPositionDescending: "내림차순으로 정렬됨, 정렬 순서 {position}/{total}",
    sortAddedAscending: "{columnName} 오름차순 정렬, {position}/{total}",
    sortAddedDescending: "{columnName} 내림차순 정렬, {position}/{total}",
    sortCleared: "{columnName} 정렬 해제됨",
    yes: "예",
    no: "아니요",
  },
  tableColumnResizer: {
    resize: "{columnName} 크기 조정",
  },
})
