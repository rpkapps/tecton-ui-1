/**
 * zh-CN translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "已选择 {item}。",
    deselectedItem: "未选择 {item}。",
    selectedCount: {
      "=0": "未选择项目。",
      one: "已选择 {count} 个项目。",
      other: "已选择 {count} 个项目。",
    },
    selectedAll: "已选择所有项目。",
  },
  chip: {
    removeButtonLabel: "删除",
    removeDescription: "按下“删除”以删除标记。",
  },
  tree: {
    expand: "扩展",
    collapse: "折叠",
  },
  dragAndDrop: {
    dragItem: "拖动 {itemText}",
    dragStartedKeyboard:
      "已开始拖动。按 Tab 导航到放置目标，然后按 Enter 放置或按 Escape 取消。",
    dragStartedVirtual: "已开始拖动。导航到放置目标，然后单击或按 Enter 放置。",
    dropCanceled: "放置已取消。",
    dropComplete: "放置已完成。",
    dropOnItem: "放置于 {itemText}",
    insertBefore: "插入到 {itemText} 之前",
    insertBetween: "插入到 {beforeItemText} 和 {afterItemText} 之间",
    insertAfter: "插入到 {itemText} 之后",
  },
})
