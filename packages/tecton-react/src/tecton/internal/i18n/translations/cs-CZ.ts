/**
 * cs-CZ translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Vybrána položka {item}.",
    deselectedItem: "Položka {item} není vybrána.",
    selectedCount: {
      "=0": "Nevybrány žádné položky.",
      one: "Vybrána {count} položka.",
      other: "Vybráno {count} položek.",
    },
    selectedAll: "Vybrány všechny položky.",
  },
  chip: {
    removeButtonLabel: "Odebrat",
    removeDescription: "Stisknutím klávesy Delete odeberete značku.",
  },
  tree: {
    expand: "Roztáhnout",
    collapse: "Sbalit",
  },
  dragAndDrop: {
    dragItem: "Přetáhnout {itemText}",
    dragStartedKeyboard:
      "Začněte s přetahováním. Po stisknutí klávesy Tab najděte požadovaný cíl a stisknutím klávesy Enter přetažení dokončete nebo stisknutím klávesy Esc akci zrušte.",
    dragStartedVirtual:
      "Začněte s přetahováním. Najděte požadovaný cíl a kliknutím nebo stisknutím klávesy Enter přetažení dokončete.",
    dropCanceled: "Přetažení bylo zrušeno.",
    dropComplete: "Přetažení bylo dokončeno.",
    dropOnItem: "Přetáhnout na {itemText}",
    insertBefore: "Vložit před {itemText}",
    insertBetween: "Vložit mezi {beforeItemText} a {afterItemText}",
    insertAfter: "Vložit za {itemText}",
  },
})
