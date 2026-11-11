/**
 * he-IL translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} נבחר.",
    deselectedItem: "{item} לא נבחר.",
    selectedCount: {
      "=0": "לא נבחרו פריטים.",
      one: "פריט {count} נבחר.",
      other: "{count} פריטים נבחרו.",
    },
    selectedAll: "כל הפריטים נבחרו.",
  },
  chip: {
    removeButtonLabel: "הסר",
    removeDescription: "לחץ על מחק כדי להסיר תג.",
  },
  tree: {
    expand: "הרחב",
    collapse: "כווץ",
  },
  dragAndDrop: {
    dragItem: "גרור את {itemText}",
    dragStartedKeyboard:
      "התחלת לגרור. הקש על Tab כדי לנווט לנקודת הגרירה ולאחר מכן הקש על Enter כדי לשחרר או על Escape כדי לבטל.",
    dragStartedVirtual:
      "התחלת לגרור. נווט לנקודת השחרור ולאחר מכן לחץ או הקש על Enter כדי לשחרר.",
    dropCanceled: "השחרור בוטל.",
    dropComplete: "השחרור הושלם.",
    dropOnItem: "שחרר על {itemText}",
    insertBefore: "הוסף לפני {itemText}",
    insertBetween: "הוסף בין {beforeItemText} לבין {afterItemText}",
    insertAfter: "הוסף אחרי {itemText}",
  },
  table: {
    select: "בחר",
    selectAll: "בחר הכול",
    ascendingSort: "מוין לפי עמודה {columnName} בסדר עולה",
    descendingSort: "מוין לפי עמודה {columnName} בסדר יורד",
  },
  dataTable: {
    loading: "טוען",
    emptyTitle: "אין שורות",
    emptyDescription: "אין כאן עדיין מה להציג.",
    noResultsTitle: "אין תוצאות",
    noResultsDescription: "אין שורות שתואמות לחיפוש ולמסננים.",
    clearFilters: "נקה מסננים",
    errorTitle: "לא ניתן היה לטעון את השורות",
    errorDescription: "אירעה שגיאה בעת טעינת הנתונים.",
    retry: "נסה שוב",
    rowsPerPage: "שורות בעמוד",
    pageInfo: "עמוד {page} מתוך {pageCount}",
    pagination: "ניווט בין עמודים",
    firstPage: "העמוד הראשון",
    previousPage: "העמוד הקודם",
    nextPage: "העמוד הבא",
    lastPage: "העמוד האחרון",
    selectedCount: {
      one: "נבחרה {selected} מתוך {total}",
      two: "נבחרו {selected} מתוך {total}",
      other: "נבחרו {selected} מתוך {total}",
    },
    selectAllMatching: {
      one: "בחר {total} שורה",
      two: "בחר את שתי השורות ({total})",
      other: "בחר את כל {total} השורות",
    },
    clearSelection: "נקה בחירה",
    rowsLoaded: {
      one: "מוצגת {total} שורה",
      two: "מוצגות {total} שורות",
      other: "מוצגות {total} שורות",
    },
    sortPositionAscending: "מוין בסדר עולה, {position} מתוך {total} בסדר המיון",
    sortPositionDescending:
      "מוין בסדר יורד, {position} מתוך {total} בסדר המיון",
    sortAddedAscending: "{columnName} מוין בסדר עולה, {position} מתוך {total}",
    sortAddedDescending: "{columnName} מוין בסדר יורד, {position} מתוך {total}",
    sortCleared: "{columnName} כבר לא ממוין",
    yes: "כן",
    no: "לא",
  },
  tableColumnResizer: {
    resize: "שנה את גודל {columnName}",
  },
})
