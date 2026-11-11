/**
 * tr-TR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} seçildi.",
    deselectedItem: "{item} seçilmedi.",
    selectedCount: {
      "=0": "Hiçbir öge seçilmedi.",
      one: "{count} öge seçildi.",
      other: "{count} öge seçildi.",
    },
    selectedAll: "Tüm ögeler seçildi.",
  },
  chip: {
    removeButtonLabel: "Kaldır",
    removeDescription: "Etiketi kaldırmak için Sil tuşuna basın.",
  },
  tree: {
    expand: "Genişlet",
    collapse: "Daralt",
  },
  dragAndDrop: {
    dragItem: "{itemText}’i sürükle",
    dragStartedKeyboard:
      "Sürükleme başlatıldı. Bir bırakma hedefine gitmek için Tab’a basın, ardından bırakmak için Enter’a basın veya iptal etmek için Escape’e basın.",
    dragStartedVirtual:
      "Sürükleme başlatıldı. Bir bırakma hedefine gidin, ardından bırakmak için Enter’a tıklayın veya basın.",
    dropCanceled: "Bırakma iptal edildi.",
    dropComplete: "Bırakma tamamlandı.",
    dropOnItem: "{itemText} üzerine bırak",
    insertBefore: "{itemText}’den önce gir",
    insertBetween: "{beforeItemText} ve {afterItemText} arasına gir",
    insertAfter: "{itemText}’den sonra gir",
  },
  table: {
    select: "Seç",
    selectAll: "Tümünü Seç",
    ascendingSort: "{columnName} sütuna göre artan düzende sırala",
    descendingSort: "{columnName} sütuna göre azalan düzende sırala",
  },
  tableColumnResizer: {
    resize: "{columnName} öğesini yeniden boyutlandır",
  },
})
