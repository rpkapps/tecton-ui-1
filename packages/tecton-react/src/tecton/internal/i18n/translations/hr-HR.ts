/**
 * hr-HR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Stavka {item} je odabrana.",
    deselectedItem: "Stavka {item} nije odabrana.",
    selectedCount: {
      "=0": "Nije odabrana nijedna stavka.",
      one: "Odabrana je {count} stavka.",
      other: "Odabrano je {count} stavki.",
    },
    selectedAll: "Odabrane su sve stavke.",
  },
  chip: {
    removeButtonLabel: "Ukloni",
    removeDescription: "Pritisnite Delete za uklanjanje oznake.",
  },
  tree: {
    expand: "Proširi",
    collapse: "Sažmi",
  },
  dragAndDrop: {
    dragItem: "Povucite stavku {itemText}",
    dragStartedKeyboard:
      "Počeli ste povlačiti. Pritisnite tipku tabulatora da biste došli do cilja ispuštanja, a zatim Enter da biste ispustili stavku ili Escape da biste prekinuli povlačenje.",
    dragStartedVirtual:
      "Počeli ste povlačiti. Dođite do cilja ispuštanja, a zatim kliknite ili pritisnite Enter da biste ispustili stavku.",
    dropCanceled: "Povlačenje je prekinuto.",
    dropComplete: "Ispuštanje je dovršeno.",
    dropOnItem: "Ispustite na stavku {itemText}",
    insertBefore: "Ispustite ispred stavke {itemText}",
    insertBetween: "Umetnite između stavki {beforeItemText} i {afterItemText}",
    insertAfter: "Umetnite iza stavke {itemText}",
  },
  tableColumnResizer: {
    resize: "Promijeni veličinu stupca {columnName}",
  },
})
