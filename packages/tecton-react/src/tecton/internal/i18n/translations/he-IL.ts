/**
 * he-IL translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
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
})
