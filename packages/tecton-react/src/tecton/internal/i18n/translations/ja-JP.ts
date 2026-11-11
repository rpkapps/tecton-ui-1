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
  dataTable: {
    loading: "読み込み中",
    emptyTitle: "行がありません",
    emptyDescription: "表示するデータはまだありません。",
    noResultsTitle: "結果がありません",
    noResultsDescription: "検索条件とフィルターに一致する行はありません。",
    clearFilters: "フィルターをクリア",
    errorTitle: "行を読み込めませんでした",
    errorDescription: "データの読み込み中に問題が発生しました。",
    retry: "再試行",
    rowsPerPage: "1 ページあたりの行数",
    pageInfo: "{page} / {pageCount} ページ",
    pagination: "ページネーション",
    firstPage: "最初のページ",
    previousPage: "前のページ",
    nextPage: "次のページ",
    lastPage: "最後のページ",
    selectedCount: {
      other: "{total} 行中 {selected} 行を選択済み",
    },
    selectAllMatching: {
      other: "{total} 行すべてを選択",
    },
    clearSelection: "選択を解除",
    rowsLoaded: { other: "{total} 行を表示中" },
    sortPositionAscending: "昇順で並べ替え、並べ替え順 {position}/{total}",
    sortPositionDescending: "降順で並べ替え、並べ替え順 {position}/{total}",
    sortAddedAscending: "{columnName} を昇順で並べ替え、{position}/{total}",
    sortAddedDescending: "{columnName} を降順で並べ替え、{position}/{total}",
    sortCleared: "{columnName} の並べ替えを解除しました",
    yes: "はい",
    no: "いいえ",
    columns: "列",
    showColumns: "列を表示",
    pinColumns: "列を固定",
    notPinned: "固定なし",
    pinnedStart: "先頭",
    pinnedEnd: "末尾",
    resetColumns: "列をリセット",
    columnMenu: "{columnName} のオプション",
    sortAscending: "昇順で並べ替え",
    sortDescending: "降順で並べ替え",
    clearSort: "並べ替えを解除",
    resizeColumn: "列の幅を変更",
    fitColumn: "内容に合わせる",
    resetColumnWidth: "幅をリセット",
    resizeHint:
      "左右の矢印キーで列の幅を変更します。Enter キーで幅を確定し、Escape キーで取り消します。",
    hideColumn: "列を非表示",
    pinToStart: "先頭に固定",
    pinToEnd: "末尾に固定",
    unpin: "固定を解除",
    columnDescription: "{columnName} について",
    columnHidden: "{columnName} を非表示にしました",
    columnShown: "{columnName} を表示しました",
    columnPinnedStart: "{columnName} を先頭に固定しました",
    columnPinnedEnd: "{columnName} を末尾に固定しました",
    columnUnpinned: "{columnName} の固定を解除しました",
  },
  tableColumnResizer: {
    resize: "{columnName} のサイズを変更",
  },
})
