/**
 * bg-BG translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} избран.",
    deselectedItem: "{item} не е избран.",
    selectedCount: {
      "=0": "Няма избрани елементи.",
      one: "{count} избран елемент.",
      other: "{count} избрани елементи.",
    },
    selectedAll: "Всички елементи са избрани.",
  },
  chip: {
    removeButtonLabel: "Премахване",
    removeDescription: "Натиснете Delete, за да премахнете маркера.",
  },
  tree: {
    expand: "Разширяване",
    collapse: "Свиване",
  },
  dragAndDrop: {
    dragItem: "Плъзни {itemText}",
    dragStartedKeyboard:
      "Започна плъзгане. Натиснете „Tab“, за да се придвижите до целта, след което натиснете „Enter“ за пускане или натиснете „Escape“ за отмяна.",
    dragStartedVirtual:
      "Започна плъзгане. Придвижете се до целта, след което щракнете или натиснете „Enter“ за пускане.",
    dropCanceled: "Пускането е отменено.",
    dropComplete: "Пускането е завършено.",
    dropOnItem: "Пусни върху {itemText}",
    insertBefore: "Вмъкни преди {itemText}",
    insertBetween: "Вмъкни между {beforeItemText} и {afterItemText}",
    insertAfter: "Вмъкни след {itemText}",
  },
  tableColumnResizer: {
    resize: "Преоразмеряване на {columnName}",
  },
})
