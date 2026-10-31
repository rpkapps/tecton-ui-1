/**
 * Internal to `@tecton/react`: localized strings, one entry per locale.
 *
 * Copied from React Aria (`react-aria` 3.52, `intl/grid`), © Adobe,
 * Apache License 2.0 (https://www.apache.org/licenses/LICENSE-2.0), with
 * ICU placeholders written as `{name}` and plurals as category maps (see
 * `useMessages`). A locale missing here falls back to its language, then
 * to `en-US`.
 */
import type { MessageTable } from "./messages"

type Keys = "selectedItem" | "deselectedItem" | "selectedCount" | "selectedAll"

const GRID_MESSAGES: MessageTable<Keys> = {
  "ar-AE": {
    selectedItem: "{item} المحدد",
    deselectedItem: "{item} غير المحدد",
    selectedCount: {
      "=0": "لم يتم تحديد عناصر.",
      one: "{count} عنصر محدد.",
      other: "{count} عنصر محدد.",
    },
    selectedAll: "جميع العناصر المحددة.",
  },
  "bg-BG": {
    selectedItem: "{item} избран.",
    deselectedItem: "{item} не е избран.",
    selectedCount: {
      "=0": "Няма избрани елементи.",
      one: "{count} избран елемент.",
      other: "{count} избрани елементи.",
    },
    selectedAll: "Всички елементи са избрани.",
  },
  "cs-CZ": {
    selectedItem: "Vybrána položka {item}.",
    deselectedItem: "Položka {item} není vybrána.",
    selectedCount: {
      "=0": "Nevybrány žádné položky.",
      one: "Vybrána {count} položka.",
      other: "Vybráno {count} položek.",
    },
    selectedAll: "Vybrány všechny položky.",
  },
  "da-DK": {
    selectedItem: "{item} valgt.",
    deselectedItem: "{item} ikke valgt.",
    selectedCount: {
      "=0": "Ingen elementer valgt.",
      one: "{count} element valgt.",
      other: "{count} elementer valgt.",
    },
    selectedAll: "Alle elementer valgt.",
  },
  "de-DE": {
    selectedItem: "{item} ausgewählt.",
    deselectedItem: "{item} nicht ausgewählt.",
    selectedCount: {
      "=0": "Keine Elemente ausgewählt.",
      one: "{count} Element ausgewählt.",
      other: "{count} Elemente ausgewählt.",
    },
    selectedAll: "Alle Elemente ausgewählt.",
  },
  "el-GR": {
    selectedItem: "Επιλέχθηκε το στοιχείο {item}.",
    deselectedItem: "Δεν επιλέχθηκε το στοιχείο {item}.",
    selectedCount: {
      "=0": "Δεν επιλέχθηκαν στοιχεία.",
      one: "Επιλέχθηκε {count} στοιχείο.",
      other: "Επιλέχθηκαν {count} στοιχεία.",
    },
    selectedAll: "Επιλέχθηκαν όλα τα στοιχεία.",
  },
  "en-US": {
    selectedItem: "{item} selected.",
    deselectedItem: "{item} not selected.",
    selectedCount: {
      "=0": "No items selected.",
      one: "{count} item selected.",
      other: "{count} items selected.",
    },
    selectedAll: "All items selected.",
  },
  "es-ES": {
    selectedItem: "{item} seleccionado.",
    deselectedItem: "{item} no seleccionado.",
    selectedCount: {
      "=0": "Ningún elemento seleccionado.",
      one: "{count} elemento seleccionado.",
      other: "{count} elementos seleccionados.",
    },
    selectedAll: "Todos los elementos seleccionados.",
  },
  "et-EE": {
    selectedItem: "{item} valitud.",
    deselectedItem: "{item} pole valitud.",
    selectedCount: {
      "=0": "Üksusi pole valitud.",
      one: "{count} üksus valitud.",
      other: "{count} üksust valitud.",
    },
    selectedAll: "Kõik üksused valitud.",
  },
  "fi-FI": {
    selectedItem: "{item} valittu.",
    deselectedItem: "Kohdetta {item} ei valittu.",
    selectedCount: {
      "=0": "Ei yhtään kohdetta valittu.",
      one: "{count} kohde valittu.",
      other: "{count} kohdetta valittu.",
    },
    selectedAll: "Kaikki kohteet valittu.",
  },
  "fr-FR": {
    selectedItem: "{item} sélectionné.",
    deselectedItem: "{item} non sélectionné.",
    selectedCount: {
      "=0": "Aucun élément sélectionné.",
      one: "{count} élément sélectionné.",
      other: "{count} éléments sélectionnés.",
    },
    selectedAll: "Tous les éléments sélectionnés.",
  },
  "he-IL": {
    selectedItem: "{item} נבחר.",
    deselectedItem: "{item} לא נבחר.",
    selectedCount: {
      "=0": "לא נבחרו פריטים.",
      one: "פריט {count} נבחר.",
      other: "{count} פריטים נבחרו.",
    },
    selectedAll: "כל הפריטים נבחרו.",
  },
  "hr-HR": {
    selectedItem: "Stavka {item} je odabrana.",
    deselectedItem: "Stavka {item} nije odabrana.",
    selectedCount: {
      "=0": "Nije odabrana nijedna stavka.",
      one: "Odabrana je {count} stavka.",
      other: "Odabrano je {count} stavki.",
    },
    selectedAll: "Odabrane su sve stavke.",
  },
  "hu-HU": {
    selectedItem: "{item} kijelölve.",
    deselectedItem: "{item} nincs kijelölve.",
    selectedCount: {
      "=0": "Egy elem sincs kijelölve.",
      one: "{count} elem kijelölve.",
      other: "{count} elem kijelölve.",
    },
    selectedAll: "Az összes elem kijelölve.",
  },
  "it-IT": {
    selectedItem: "{item} selezionato.",
    deselectedItem: "{item} non selezionato.",
    selectedCount: {
      "=0": "Nessun elemento selezionato.",
      one: "{count} elemento selezionato.",
      other: "{count} elementi selezionati.",
    },
    selectedAll: "Tutti gli elementi selezionati.",
  },
  "ja-JP": {
    selectedItem: "{item} を選択しました。",
    deselectedItem: "{item} が選択されていません。",
    selectedCount: {
      "=0": "項目が選択されていません。",
      one: "{count} 項目を選択しました。",
      other: "{count} 項目を選択しました。",
    },
    selectedAll: "すべての項目を選択しました。",
  },
  "ko-KR": {
    selectedItem: "{item}이(가) 선택되었습니다.",
    deselectedItem: "{item}이(가) 선택되지 않았습니다.",
    selectedCount: {
      "=0": "선택된 항목이 없습니다.",
      one: "{count}개 항목이 선택되었습니다.",
      other: "{count}개 항목이 선택되었습니다.",
    },
    selectedAll: "모든 항목이 선택되었습니다.",
  },
  "lt-LT": {
    selectedItem: "Pasirinkta: {item}.",
    deselectedItem: "{item} nepasirinkta.",
    selectedCount: {
      "=0": "Nepasirinktas nė vienas elementas.",
      one: "Pasirinktas {count} elementas.",
      other: "Pasirinkta elementų: {count}.",
    },
    selectedAll: "Pasirinkti visi elementai.",
  },
  "lv-LV": {
    selectedItem: "Atlasīts vienums {item}.",
    deselectedItem: "Vienums {item} nav atlasīts.",
    selectedCount: {
      "=0": "Nav atlasīts neviens vienums.",
      one: "Atlasīto vienumu skaits: {count}.",
      other: "Atlasīto vienumu skaits: {count}.",
    },
    selectedAll: "Atlasīti visi vienumi.",
  },
  "nb-NO": {
    selectedItem: "{item} er valgt.",
    deselectedItem: "{item} er ikke valgt.",
    selectedCount: {
      "=0": "Ingen elementer er valgt.",
      one: "{count} element er valgt.",
      other: "{count} elementer er valgt.",
    },
    selectedAll: "Alle elementer er valgt.",
  },
  "nl-NL": {
    selectedItem: "{item} geselecteerd.",
    deselectedItem: "{item} niet geselecteerd.",
    selectedCount: {
      "=0": "Geen items geselecteerd.",
      one: "{count} item geselecteerd.",
      other: "{count} items geselecteerd.",
    },
    selectedAll: "Alle items geselecteerd.",
  },
  "pl-PL": {
    selectedItem: "Zaznaczono {item}.",
    deselectedItem: "Nie zaznaczono {item}.",
    selectedCount: {
      "=0": "Nie zaznaczono żadnych elementów.",
      one: "{count} zaznaczony element.",
      other: "{count} zaznaczonych elementów.",
    },
    selectedAll: "Wszystkie zaznaczone elementy.",
  },
  "pt-BR": {
    selectedItem: "{item} selecionado.",
    deselectedItem: "{item} não selecionado.",
    selectedCount: {
      "=0": "Nenhum item selecionado.",
      one: "{count} item selecionado.",
      other: "{count} itens selecionados.",
    },
    selectedAll: "Todos os itens selecionados.",
  },
  "pt-PT": {
    selectedItem: "{item} selecionado.",
    deselectedItem: "{item} não selecionado.",
    selectedCount: {
      "=0": "Nenhum item selecionado.",
      one: "{count} item selecionado.",
      other: "{count} itens selecionados.",
    },
    selectedAll: "Todos os itens selecionados.",
  },
  "ro-RO": {
    selectedItem: "{item} selectat.",
    deselectedItem: "{item} neselectat.",
    selectedCount: {
      "=0": "Niciun element selectat.",
      one: "{count} element selectat.",
      other: "{count} elemente selectate.",
    },
    selectedAll: "Toate elementele selectate.",
  },
  "ru-RU": {
    selectedItem: "{item} выбрано.",
    deselectedItem: "{item} не выбрано.",
    selectedCount: {
      "=0": "Нет выбранных элементов.",
      one: "{count} элемент выбран.",
      other: "{count} элементов выбрано.",
    },
    selectedAll: "Выбраны все элементы.",
  },
  "sk-SK": {
    selectedItem: "Vybraté položky: {item}.",
    deselectedItem: "Nevybraté položky: {item}.",
    selectedCount: {
      "=0": "Žiadne vybraté položky.",
      one: "{count} vybratá položka.",
      other: "Počet vybratých položiek:{count}.",
    },
    selectedAll: "Všetky vybraté položky.",
  },
  "sl-SI": {
    selectedItem: "Element {item} je izbran.",
    deselectedItem: "Element {item} ni izbran.",
    selectedCount: {
      "=0": "Noben element ni izbran.",
      one: "{count} element je izbran.",
      other: "{count} elementov je izbranih.",
    },
    selectedAll: "Vsi elementi so izbrani.",
  },
  "sr-SP": {
    selectedItem: "{item} je izabrano.",
    deselectedItem: "{item} nije izabrano.",
    selectedCount: {
      "=0": "Nije izabrana nijedna stavka.",
      one: "Izabrana je {count} stavka.",
      other: "Izabrano je {count} stavki.",
    },
    selectedAll: "Izabrane su sve stavke.",
  },
  "sv-SE": {
    selectedItem: "{item} markerat.",
    deselectedItem: "{item} ej markerat.",
    selectedCount: {
      "=0": "Inga markerade objekt.",
      one: "{count} markerat objekt.",
      other: "{count} markerade objekt.",
    },
    selectedAll: "Alla markerade objekt.",
  },
  "tr-TR": {
    selectedItem: "{item} seçildi.",
    deselectedItem: "{item} seçilmedi.",
    selectedCount: {
      "=0": "Hiçbir öge seçilmedi.",
      one: "{count} öge seçildi.",
      other: "{count} öge seçildi.",
    },
    selectedAll: "Tüm ögeler seçildi.",
  },
  "uk-UA": {
    selectedItem: "{item} вибрано.",
    deselectedItem: "{item} не вибрано.",
    selectedCount: {
      "=0": "Жодних елементів не вибрано.",
      one: "{count} елемент вибрано.",
      other: "Вибрано елементів: {count}.",
    },
    selectedAll: "Усі елементи вибрано.",
  },
  "zh-CN": {
    selectedItem: "已选择 {item}。",
    deselectedItem: "未选择 {item}。",
    selectedCount: {
      "=0": "未选择项目。",
      one: "已选择 {count} 个项目。",
      other: "已选择 {count} 个项目。",
    },
    selectedAll: "已选择所有项目。",
  },
  "zh-TW": {
    selectedItem: "已選取「{item}」。",
    deselectedItem: "未選取「{item}」。",
    selectedCount: {
      "=0": "未選取任何項目。",
      one: "已選取 {count} 個項目。",
      other: "已選取 {count} 個項目。",
    },
    selectedAll: "已選取所有項目。",
  },
}

export { GRID_MESSAGES }
