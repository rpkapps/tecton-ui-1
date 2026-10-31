/**
 * pt-PT translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} selecionado.",
    deselectedItem: "{item} não selecionado.",
    selectedCount: {
      "=0": "Nenhum item selecionado.",
      one: "{count} item selecionado.",
      other: "{count} itens selecionados.",
    },
    selectedAll: "Todos os itens selecionados.",
  },
  chip: {
    removeButtonLabel: "Eliminar",
    removeDescription: "Prima Delete para eliminar a tag.",
  },
  tree: {
    expand: "Expandir",
    collapse: "Colapsar",
  },
  dragAndDrop: {
    dragItem: "Arrastar {itemText}",
    dragStartedKeyboard:
      "Arrasto iniciado. Prima a tecla de tabulação para navegar para um destino para largar, e em seguida prima Enter para largar ou prima Escape para cancelar.",
    dragStartedVirtual:
      "Arrasto iniciado. Navegue para um destino para largar, e em seguida clique ou prima Enter para largar.",
    dropCanceled: "Largar cancelado.",
    dropComplete: "Largar completo.",
    dropOnItem: "Largar em {itemText}",
    insertBefore: "Inserir antes de {itemText}",
    insertBetween: "Inserir entre {beforeItemText} e {afterItemText}",
    insertAfter: "Inserir depois de {itemText}",
  },
})
