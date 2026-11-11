/**
 * ja-JP translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} を選択しました。",
    deselectedItem: "{item} が選択されていません。",
    selectedCount: {
      "=0": "項目が選択されていません。",
      one: "{count} 項目を選択しました。",
      other: "{count} 項目を選択しました。",
    },
    selectedAll: "すべての項目を選択しました。",
  },
  chip: {
    removeButtonLabel: "削除",
    removeDescription: "タグを削除するには、Delete キーを押します。",
  },
  tree: {
    expand: "展開",
    collapse: "折りたたむ",
  },
  dragAndDrop: {
    dragItem: "{itemText} をドラッグ",
    dragStartedKeyboard:
      "ドラッグを開始します。Tab キーを押してドロップターゲットにいどうし、Enter キーを押してドロップするか、Esc キーを押してキャンセルします。",
    dragStartedVirtual:
      "ドラッグを開始しました。ドロップのターゲットに移動し、クリックまたは Enter キーを押してドロップします。",
    dropCanceled: "ドロップがキャンセルされました。",
    dropComplete: "ドロップが完了しました。",
    dropOnItem: "{itemText} にドロップ",
    insertBefore: "{itemText} の前に挿入",
    insertBetween: "{beforeItemText} と {afterItemText} の間に挿入",
    insertAfter: "{itemText} の後に挿入",
  },
  table: {
    select: "選択",
    selectAll: "すべて選択",
    ascendingSort: "列 {columnName} を昇順で並べ替え",
    descendingSort: "列 {columnName} を降順で並べ替え",
  },
  tableColumnResizer: {
    resize: "{columnName} のサイズを変更",
  },
})
