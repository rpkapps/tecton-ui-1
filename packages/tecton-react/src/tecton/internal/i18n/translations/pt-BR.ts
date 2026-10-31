/**
 * pt-BR translations, loaded only when a `TectonProvider` uses this locale.
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
    removeButtonLabel: "Remover",
    removeDescription: "Pressione Delete para remover a tag.",
  },
  tree: {
    expand: "Expandir",
    collapse: "Recolher",
  },
  dragAndDrop: {
    dragItem: "Arrastar {itemText}",
    dragStartedKeyboard:
      "Comece a arrastar. Pressione Tab para navegar até um alvo e, em seguida, pressione Enter para soltar ou pressione Escape para cancelar.",
    dragStartedVirtual:
      "Comece a arrastar. Navegue até um alvo e clique ou pressione Enter para soltar.",
    dropCanceled: "Liberação cancelada.",
    dropComplete: "Liberação concluída.",
    dropOnItem: "Soltar em {itemText}",
    insertBefore: "Inserir antes de {itemText}",
    insertBetween: "Inserir entre {beforeItemText} e {afterItemText}",
    insertAfter: "Inserir após {itemText}",
  },
})
