/**
 * fr-FR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} sélectionné.",
    deselectedItem: "{item} non sélectionné.",
    selectedCount: {
      "=0": "Aucun élément sélectionné.",
      one: "{count} élément sélectionné.",
      other: "{count} éléments sélectionnés.",
    },
    selectedAll: "Tous les éléments sélectionnés.",
  },
  chip: {
    removeButtonLabel: "Supprimer",
    removeDescription: "Appuyez sur Supprimer pour supprimer l’étiquette.",
  },
  tree: {
    expand: "Développer",
    collapse: "Réduire",
  },
  dragAndDrop: {
    dragItem: "Déplacer {itemText}",
    dragStartedKeyboard:
      "Déplacement commencé. Appuyez sur Tabulation pour accéder à une cible de dépôt, puis appuyez sur Entrée pour déposer, ou appuyez sur Échap pour annuler.",
    dragStartedVirtual:
      "Déplacement commencé. Accédez à une cible de dépôt, puis cliquez ou appuyez sur Entrée pour déposer.",
    dropCanceled: "Dépôt annulé.",
    dropComplete: "Dépôt terminé.",
    dropOnItem: "Déposer sur {itemText}",
    insertBefore: "Insérer avant {itemText}",
    insertBetween: "Insérer entre {beforeItemText} et {afterItemText}",
    insertAfter: "Insérer après {itemText}",
  },
})
