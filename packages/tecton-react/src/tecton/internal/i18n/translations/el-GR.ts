/**
 * el-GR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
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
  table: {
    select: "Επιλογή",
    selectAll: "Επιλογή όλων",
    ascendingSort: "διαλογή ανά στήλη {columnName} σε αύξουσα σειρά",
    descendingSort: "διαλογή ανά στήλη {columnName} σε φθίνουσα σειρά",
  },
  dataTable: {
    loading: "Φόρτωση",
    emptyTitle: "Δεν υπάρχουν γραμμές",
    emptyDescription: "Δεν υπάρχει ακόμη τίποτα για εμφάνιση εδώ.",
    noResultsTitle: "Δεν βρέθηκαν αποτελέσματα",
    noResultsDescription:
      "Καμία γραμμή δεν αντιστοιχεί στην αναζήτηση και στα φίλτρα.",
    clearFilters: "Απαλοιφή φίλτρων",
    errorTitle: "Δεν ήταν δυνατή η φόρτωση των γραμμών",
    errorDescription: "Παρουσιάστηκε σφάλμα κατά τη φόρτωση των δεδομένων.",
    retry: "Επανάληψη",
    rowsPerPage: "Γραμμές ανά σελίδα",
    pageInfo: "Σελίδα {page} από {pageCount}",
    pagination: "Σελιδοποίηση",
    firstPage: "Πρώτη σελίδα",
    previousPage: "Προηγούμενη σελίδα",
    nextPage: "Επόμενη σελίδα",
    lastPage: "Τελευταία σελίδα",
    selectedCount: {
      one: "Επιλέχθηκε {selected} από {total}",
      other: "Επιλέχθηκαν {selected} από {total}",
    },
    selectAllMatching: {
      one: "Επιλογή {total} γραμμής",
      other: "Επιλογή και των {total} γραμμών",
    },
    clearSelection: "Απαλοιφή επιλογής",
    rowsLoaded: {
      one: "Εμφανίζεται {total} γραμμή",
      other: "Εμφανίζονται {total} γραμμές",
    },
    sortPositionAscending:
      "ταξινομημένο σε αύξουσα σειρά, {position} από {total} στη σειρά ταξινόμησης",
    sortPositionDescending:
      "ταξινομημένο σε φθίνουσα σειρά, {position} από {total} στη σειρά ταξινόμησης",
    sortAddedAscending:
      "Η στήλη {columnName} ταξινομήθηκε σε αύξουσα σειρά, {position} από {total}",
    sortAddedDescending:
      "Η στήλη {columnName} ταξινομήθηκε σε φθίνουσα σειρά, {position} από {total}",
    sortCleared: "Η στήλη {columnName} δεν ταξινομείται πλέον",
    yes: "Ναι",
    no: "Όχι",
  },
  tableColumnResizer: {
    resize: "Αλλαγή μεγέθους {columnName}",
  },
})
