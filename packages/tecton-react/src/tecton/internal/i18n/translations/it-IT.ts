/**
 * it-IT translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} selezionato.",
    deselectedItem: "{item} non selezionato.",
    selectedCount: {
      "=0": "Nessun elemento selezionato.",
      one: "{count} elemento selezionato.",
      other: "{count} elementi selezionati.",
    },
    selectedAll: "Tutti gli elementi selezionati.",
  },
  chip: {
    removeButtonLabel: "Rimuovi",
    removeDescription: "Premi Elimina per rimuovere il tag.",
  },
  tree: {
    expand: "Espandi",
    collapse: "Comprimi",
  },
  dragAndDrop: {
    dragItem: "Trascina {itemText}",
    dragStartedKeyboard:
      "Hai iniziato a trascinare. Premi Tab per arrivare sull’area di destinazione, quindi premi Invio per rilasciare o Esc per annullare.",
    dragStartedVirtual:
      "Hai iniziato a trascinare. Arriva sull’area di destinazione, quindi fai clic o premi Invio per rilasciare.",
    dropCanceled: "Rilascio annullato.",
    dropComplete: "Rilascio completato.",
    dropOnItem: "Rilascia su {itemText}",
    insertBefore: "Inserisci prima di {itemText}",
    insertBetween: "Inserisci tra {beforeItemText} e {afterItemText}",
    insertAfter: "Inserisci dopo {itemText}",
  },
  tableColumnResizer: {
    resize: "Ridimensiona {columnName}",
  },
})
