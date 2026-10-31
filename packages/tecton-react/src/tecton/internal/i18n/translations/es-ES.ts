/**
 * es-ES translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} seleccionado.",
    deselectedItem: "{item} no seleccionado.",
    selectedCount: {
      "=0": "Ningún elemento seleccionado.",
      one: "{count} elemento seleccionado.",
      other: "{count} elementos seleccionados.",
    },
    selectedAll: "Todos los elementos seleccionados.",
  },
  chip: {
    removeButtonLabel: "Quitar",
    removeDescription: "Pulse Eliminar para quitar la etiqueta.",
  },
  tree: {
    expand: "Expandir",
    collapse: "Contraer",
  },
  dragAndDrop: {
    dragItem: "Arrastrar {itemText}",
    dragStartedKeyboard:
      "Se ha empezado a arrastrar. Pulse el tabulador para ir al destino donde se vaya a colocar y, a continuación, pulse Intro para soltar, o pulse Escape para cancelar.",
    dragStartedVirtual:
      "Se ha empezado a arrastrar. Vaya al destino donde se vaya a colocar y, a continuación, haga clic o pulse Intro para soltar.",
    dropCanceled: "Se ha cancelado la colocación.",
    dropComplete: "Colocación finalizada.",
    dropOnItem: "Soltar en {itemText}",
    insertBefore: "Insertar antes de {itemText}",
    insertBetween: "Insertar entre {beforeItemText} y {afterItemText}",
    insertAfter: "Insertar después de {itemText}",
  },
})
