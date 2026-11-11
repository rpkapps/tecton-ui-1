/**
 * zh-CN translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
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
  table: {
    select: "选择",
    selectAll: "全选",
    ascendingSort: "按列 {columnName} 升序排序",
    descendingSort: "按列 {columnName} 降序排序",
  },
  dataTable: {
    loading: "正在加载",
    emptyTitle: "暂无数据",
    emptyDescription: "此处尚无可显示的内容。",
    noResultsTitle: "无结果",
    noResultsDescription: "没有与搜索和筛选条件匹配的行。",
    clearFilters: "清除筛选条件",
    errorTitle: "无法加载数据行",
    errorDescription: "加载数据时出错。",
    retry: "重试",
    rowsPerPage: "每页行数",
    pageInfo: "第 {page} 页，共 {pageCount} 页",
    pagination: "分页",
    firstPage: "第一页",
    previousPage: "上一页",
    nextPage: "下一页",
    lastPage: "最后一页",
    selectedCount: {
      other: "已选择 {selected} 行，共 {total} 行",
    },
    selectAllMatching: {
      other: "选择全部 {total} 行",
    },
    clearSelection: "清除选择",
    rowsLoaded: { other: "正在显示 {total} 行" },
    sortPositionAscending: "已升序排序，排序顺序 {position}/{total}",
    sortPositionDescending: "已降序排序，排序顺序 {position}/{total}",
    sortAddedAscending: "{columnName} 已按升序排序，{position}/{total}",
    sortAddedDescending: "{columnName} 已按降序排序，{position}/{total}",
    sortCleared: "{columnName} 已取消排序",
    yes: "是",
    no: "否",
    columns: "列",
    showColumns: "显示列",
    pinColumns: "固定列",
    notPinned: "未固定",
    pinnedStart: "开头",
    pinnedEnd: "末尾",
    resetColumns: "重置列",
    columnMenu: "{columnName} 选项",
    sortAscending: "升序排序",
    sortDescending: "降序排序",
    clearSort: "清除排序",
    resizeColumn: "调整列宽",
    fitColumn: "适应内容",
    resetColumnWidth: "重置宽度",
    resizeHint: "使用左右箭头键调整列宽。按 Enter 保留宽度，按 Escape 取消。",
    hideColumn: "隐藏列",
    pinToStart: "固定到开头",
    pinToEnd: "固定到末尾",
    unpin: "取消固定",
    columnDescription: "关于 {columnName}",
    columnHidden: "已隐藏 {columnName}",
    columnShown: "已显示 {columnName}",
    columnPinnedStart: "已将 {columnName} 固定到开头",
    columnPinnedEnd: "已将 {columnName} 固定到末尾",
    columnUnpinned: "已取消固定 {columnName}",
  },
  tableColumnResizer: {
    resize: "调整 {columnName} 的大小",
  },
})
