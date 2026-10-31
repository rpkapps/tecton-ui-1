/**
 * el-GR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Επιλέχθηκε το στοιχείο {item}.",
    deselectedItem: "Δεν επιλέχθηκε το στοιχείο {item}.",
    selectedCount: {
      "=0": "Δεν επιλέχθηκαν στοιχεία.",
      one: "Επιλέχθηκε {count} στοιχείο.",
      other: "Επιλέχθηκαν {count} στοιχεία.",
    },
    selectedAll: "Επιλέχθηκαν όλα τα στοιχεία.",
  },
  chip: {
    removeButtonLabel: "Κατάργηση",
    removeDescription: "Πατήστε Διαγραφή για να καταργήσετε την ετικέτα.",
  },
  tree: {
    expand: "Ανάπτυξη",
    collapse: "Σύμπτυξη",
  },
  dragAndDrop: {
    dragItem: "Μεταφορά {itemText}",
    dragStartedKeyboard:
      "Η μεταφορά ξεκίνησε. Πατήστε το πλήκτρο Tab για να μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, πατήστε Enter για απόθεση ή πατήστε Escape για ακύρωση.",
    dragStartedVirtual:
      "Η μεταφορά ξεκίνησε. Μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, κάντε κλικ ή πατήστε Enter για απόθεση.",
    dropCanceled: "Η απόθεση ακυρώθηκε.",
    dropComplete: "Η απόθεση ολοκληρώθηκε.",
    dropOnItem: "Απόθεση σε {itemText}",
    insertBefore: "Εισαγωγή πριν από {itemText}",
    insertBetween: "Εισαγωγή μεταξύ {beforeItemText} και {afterItemText}",
    insertAfter: "Εισαγωγή μετά από {itemText}",
  },
  tableColumnResizer: {
    resize: "Αλλαγή μεγέθους {columnName}",
  },
})
