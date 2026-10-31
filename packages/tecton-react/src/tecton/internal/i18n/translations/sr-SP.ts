/**
 * sr-SP translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} je izabrano.",
    deselectedItem: "{item} nije izabrano.",
    selectedCount: {
      "=0": "Nije izabrana nijedna stavka.",
      one: "Izabrana je {count} stavka.",
      other: "Izabrano je {count} stavki.",
    },
    selectedAll: "Izabrane su sve stavke.",
  },
  chip: {
    removeButtonLabel: "Ukloni",
    removeDescription: "Pritisnite Obriši da biste uklonili oznaku.",
  },
  tree: {
    expand: "Proširi",
    collapse: " Skupi",
  },
  dragAndDrop: {
    dragItem: "Prevucite {itemText}",
    dragStartedKeyboard:
      "Prevlačenje je započeto. Pritisnite Tab da biste otišli do cilja za otpuštanje, zatim pritisnite Enter za ispuštanje ili pritisnite Escape za otkazivanje.",
    dragStartedVirtual:
      "Prevlačenje je započeto. Idite do cilja za otpuštanje, a zatim kliknite ili pritinite Enter za otpuštanje.",
    dropCanceled: "Otpuštanje je otkazano.",
    dropComplete: "Prevlačenje je završeno.",
    dropOnItem: "Otpusti na {itemText}",
    insertBefore: "Umetnite ispred {itemText}",
    insertBetween: "Umetnite između {beforeItemText} i {afterItemText}",
    insertAfter: "Umetnite posle {itemText}",
  },
  tableColumnResizer: {
    resize: "Promeni veličinu kolone {columnName}",
  },
})
