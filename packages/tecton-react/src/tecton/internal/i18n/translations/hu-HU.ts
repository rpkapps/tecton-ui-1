/**
 * hu-HU translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} kijelölve.",
    deselectedItem: "{item} nincs kijelölve.",
    selectedCount: {
      "=0": "Egy elem sincs kijelölve.",
      one: "{count} elem kijelölve.",
      other: "{count} elem kijelölve.",
    },
    selectedAll: "Az összes elem kijelölve.",
  },
  chip: {
    removeButtonLabel: "Eltávolítás",
    removeDescription:
      "Nyomja meg a Delete billentyűt a címke eltávolításához.",
  },
  tree: {
    expand: "Kibontás",
    collapse: "Összecsukás",
  },
  dragAndDrop: {
    dragItem: "{itemText} húzása",
    dragStartedKeyboard:
      "Húzás megkezdve. Nyomja le a Tab billentyűt az elengedési célhoz navigálásához, majd nyomja le az Enter billentyűt az elengedéshez, vagy nyomja le az Escape billentyűt a megszakításhoz.",
    dragStartedVirtual:
      "Húzás megkezdve. Navigáljon egy elengedési célhoz, majd kattintson vagy nyomja le az Enter billentyűt az elengedéshez.",
    dropCanceled: "Elengedés megszakítva.",
    dropComplete: "Elengedés teljesítve.",
    dropOnItem: "Elengedés erre: {itemText}",
    insertBefore: "Beszúrás {itemText} elé",
    insertBetween: "Beszúrás {beforeItemText} és {afterItemText} közé",
    insertAfter: "Beszúrás {itemText} után",
  },
  tableColumnResizer: {
    resize: "{columnName} átméretezése",
  },
})
