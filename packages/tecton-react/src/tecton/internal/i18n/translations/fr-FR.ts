/**
 * fr-FR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
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
  table: {
    select: "Sélectionner",
    selectAll: "Sélectionner tout",
    ascendingSort:
      "trié en fonction de la colonne {columnName} par ordre croissant",
    descendingSort:
      "trié en fonction de la colonne {columnName} par ordre décroissant",
  },
  dataTable: {
    loading: "Chargement",
    emptyTitle: "Aucune ligne",
    emptyDescription: "Il n’y a encore rien à afficher ici.",
    noResultsTitle: "Aucun résultat",
    noResultsDescription:
      "Aucune ligne ne correspond à la recherche et aux filtres.",
    clearFilters: "Effacer les filtres",
    errorTitle: "Impossible de charger les lignes",
    errorDescription:
      "Une erreur s’est produite lors du chargement des données.",
    retry: "Réessayer",
    rowsPerPage: "Lignes par page",
    pageInfo: "Page {page} sur {pageCount}",
    pagination: "Pagination",
    firstPage: "Première page",
    previousPage: "Page précédente",
    nextPage: "Page suivante",
    lastPage: "Dernière page",
    selectedCount: {
      one: "{selected} ligne sélectionnée sur {total}",
      many: "{selected} de lignes sélectionnées sur {total}",
      other: "{selected} lignes sélectionnées sur {total}",
    },
    selectAllMatching: {
      one: "Sélectionner {total} ligne",
      many: "Sélectionner les {total} de lignes",
      other: "Sélectionner les {total} lignes",
    },
    clearSelection: "Effacer la sélection",
    rowsLoaded: {
      one: "{total} ligne affichée",
      other: "{total} lignes affichées",
    },
    sortPositionAscending:
      "trié par ordre croissant, {position} sur {total} dans l’ordre de tri",
    sortPositionDescending:
      "trié par ordre décroissant, {position} sur {total} dans l’ordre de tri",
    sortAddedAscending:
      "{columnName} trié par ordre croissant, {position} sur {total}",
    sortAddedDescending:
      "{columnName} trié par ordre décroissant, {position} sur {total}",
    sortCleared: "{columnName} n’est plus trié",
    yes: "Oui",
    no: "Non",
  },
  tableColumnResizer: {
    resize: "Redimensionner {columnName}",
  },
})
