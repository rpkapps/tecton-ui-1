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
    columns: "Colonnes",
    showColumns: "Afficher les colonnes",
    pinColumns: "Épingler les colonnes",
    notPinned: "Non épinglée",
    pinnedStart: "Début",
    pinnedEnd: "Fin",
    resetColumns: "Réinitialiser les colonnes",
    columnMenu: "Options de {columnName}",
    sortAscending: "Trier par ordre croissant",
    sortDescending: "Trier par ordre décroissant",
    clearSort: "Effacer le tri",
    resizeColumn: "Redimensionner la colonne",
    fitColumn: "Ajuster au contenu",
    resetColumnWidth: "Réinitialiser la largeur",
    resizeHint:
      "Utilisez les flèches gauche et droite pour redimensionner la colonne. Appuyez sur Entrée pour conserver la largeur ou sur Échap pour annuler.",
    hideColumn: "Masquer la colonne",
    pinToStart: "Épingler au début",
    pinToEnd: "Épingler à la fin",
    unpin: "Désépingler",
    columnDescription: "À propos de {columnName}",
    columnHidden: "Colonne {columnName} masquée",
    columnShown: "Colonne {columnName} affichée",
    columnPinnedStart: "Colonne {columnName} épinglée au début",
    columnPinnedEnd: "Colonne {columnName} épinglée à la fin",
    columnUnpinned: "Colonne {columnName} désépinglée",
    search: "Rechercher",
    searchChip: "Recherche",
    clearSearch: "Effacer la recherche",
    filterBy: "Filtrer par {columnName}",
    filterContains: "Contient",
    filterMin: "Min.",
    filterMax: "Max.",
    filterAny: "Tous",
    clearFilter: "Effacer",
    noOptions: "Aucune option",
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    filterFrom: "À partir du {value}",
    filterUntil: "Jusqu’au {value}",
    optionsSelected: { other: "{total} sélectionnés" },
    filterChip: "{columnName} : {value}",
    activeFilters: "Filtres actifs",
    clearAll: "Tout effacer",
    resultsCount: { one: "{total} résultat", other: "{total} résultats" },
    rowActions: "Actions de la ligne",
    reorderRowsColumn: "Réorganiser",
    total: "Total",
    groupBy: "Grouper par",
    groupOrder: "Ordre",
    moveGroupUp: "Monter {columnName}",
    ungroupAll: "Tout dégrouper",
    expandAllGroups: "Développer tous les groupes",
    collapseAllGroups: "Réduire tous les groupes",
    groupByColumn: "Grouper par colonne",
    ungroupColumn: "Dégrouper la colonne",
    groupedBy: "Groupé par {columnNames}",
    ungrouped: "Lignes non groupées",
    groupLabel: "{columnName} : {value}",
    emptyGroup: "(Vide)",
    groupCount: { one: "{total} ligne", other: "{total} lignes" },
    groupRowLabel: "{label}, {rows}",
    cellsSelected: {
      one: "{total} cellule sélectionnée",
      other: "{total} cellules sélectionnées",
    },
    cellsCopied: {
      one: "{total} cellule copiée",
      other: "{total} cellules copiées",
    },
    cellsPasted: {
      "=0": "Aucune cellule collée",
      one: "{total} cellule collée",
      other: "{total} cellules collées",
    },
    cellsCleared: {
      "=0": "Aucune cellule effacée",
      one: "{total} cellule effacée",
      other: "{total} cellules effacées",
    },
    cellsFilled: {
      "=0": "Aucune cellule remplie",
      one: "{total} cellule remplie",
      other: "{total} cellules remplies",
    },
    cellsSkipped: {
      one: "{total} non modifiable",
      other: "{total} non modifiables",
    },
    cellsInvalid: { one: "{total} non valide", other: "{total} non valides" },
    cellMessage: "{columnName} : {message}",
    refusedValue: "« {value} » : {message}",
    selectCellsFirst: "Sélectionnez d’abord des cellules",
    cellsNotSaved: {
      one: "{total} cellule non enregistrée : {message}",
      other: "{total} cellules non enregistrées : {message}",
    },
    saveFailed: "La modification n’a pas pu être enregistrée",
    copyMultiple:
      "Ces plages ne peuvent pas être copiées ensemble : sélectionnez des plages sur les mêmes lignes ou dans les mêmes colonnes",
    pasteMultiple:
      "Un bloc de cellules ne peut pas être collé dans plusieurs plages",
    copyFailed: "Les cellules n’ont pas pu être copiées dans le presse-papiers",
    invalidValue: "Valeur non valide",
    invalidNumber: "Saisissez un nombre",
    invalidDate: "Saisissez une date",
    invalidBoolean: "Saisissez {yes} ou {no}",
    invalidOption: "Choisissez l’une des options",
    editorLabel: "{columnName}, {rowName}",
    cellSaved: "Enregistré",
    chooseDate: "Choisir une date",
    noMatchingOptions: "Aucune option correspondante",
    editDiscarded: "Modification abandonnée : la ligne n’est plus disponible",
    cellSummary: "Cellules sélectionnées",
    summarySum: "Somme : {value}",
    summaryAverage: "Moyenne : {value}",
    summaryNumericCount: "Nombre de valeurs numériques : {value}",
    summaryCount: "Nombre : {value}",
  },
  tableColumnResizer: {
    resize: "Redimensionner {columnName}",
  },
})
