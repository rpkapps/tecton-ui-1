/**
 * zh-TW translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "已選取「{item}」。",
    deselectedItem: "未選取「{item}」。",
    selectedCount: {
      "=0": "未選取任何項目。",
      one: "已選取 {count} 個項目。",
      other: "已選取 {count} 個項目。",
    },
    selectedAll: "已選取所有項目。",
  },
  chip: {
    removeButtonLabel: "移除",
    removeDescription: "按 Delete 鍵以移除標記。",
  },
  tree: {
    expand: "展開",
    collapse: "收合",
  },
  dragAndDrop: {
    dragItem: "拖曳「{itemText}」",
    dragStartedKeyboard:
      "已開始拖曳。按 Tab 鍵以瀏覽至放置目標，然後按 Enter 鍵以放置，或按 Escape 鍵以取消。",
    dragStartedVirtual:
      "已開始拖曳。瀏覽至放置目標，然後按一下滑鼠或按 Enter 鍵以放置。",
    dropCanceled: "放置已取消。",
    dropComplete: "放置已完成。",
    dropOnItem: "放置在「{itemText}」上",
    insertBefore: "插入至「{itemText}」之前",
    insertBetween: "插入至「{beforeItemText}」和「{afterItemText}」之間",
    insertAfter: "插入至「{itemText}」之後",
  },
})
