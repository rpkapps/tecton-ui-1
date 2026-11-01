/**
 * ko-KR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
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
  tableColumnResizer: {
    resize: "{columnName} 크기 조정",
  },
})
