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
  dataTable: {
    loading: "Yükleniyor",
    emptyTitle: "Satır yok",
    emptyDescription: "Burada henüz gösterilecek bir şey yok.",
    noResultsTitle: "Sonuç yok",
    noResultsDescription: "Aramayla ve filtrelerle eşleşen satır yok.",
    clearFilters: "Filtreleri temizle",
    errorTitle: "Satırlar yüklenemedi",
    errorDescription: "Veriler yüklenirken bir sorun oluştu.",
    retry: "Yeniden dene",
    rowsPerPage: "Sayfa başına satır",
    pageInfo: "Sayfa {page}/{pageCount}",
    pagination: "Sayfalandırma",
    firstPage: "İlk sayfa",
    previousPage: "Önceki sayfa",
    nextPage: "Sonraki sayfa",
    lastPage: "Son sayfa",
    selectedCount: {
      one: "{selected}/{total} seçildi",
      other: "{selected}/{total} seçildi",
    },
    selectAllMatching: {
      one: "{total} satırı seç",
      other: "{total} satırın tümünü seç",
    },
    clearSelection: "Seçimi temizle",
    rowsLoaded: {
      one: "{total} satır gösteriliyor",
      other: "{total} satır gösteriliyor",
    },
    sortPositionAscending:
      "artan düzende sıralandı, sıralama düzeninde {position}/{total}",
    sortPositionDescending:
      "azalan düzende sıralandı, sıralama düzeninde {position}/{total}",
    sortAddedAscending:
      "{columnName} artan şekilde sıralandı, {position}/{total}",
    sortAddedDescending:
      "{columnName} azalan şekilde sıralandı, {position}/{total}",
    sortCleared: "{columnName} artık sıralı değil",
    yes: "Evet",
    no: "Hayır",
  },
  tableColumnResizer: {
    resize: "{columnName} öğesini yeniden boyutlandır",
  },
})
