/**
 * fr-FR strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Saisissez des termes côte à côte : chaque terme s’applique. Un terme est un texte à rechercher, ou une colonne et ses valeurs. Choisissez un exemple pour l’ajouter.",
    helpExample: "Exemple",
    helpFinds: "Trouve",
    findsWords: "Lignes contenant ce texte dans une colonne",
    findsPhrase: "Les guillemets gardent les mots ensemble",
    findsText: "{column} contient le texte",
    findsOptions: "{column} est l’une des valeurs listées",
    findsBoolean: "{column} est oui ou non",
    findsNumber: "{column} comparé avec > >= < <=, ou une plage a..b",
    findsDate:
      "{column} dans une année, un mois ou un jour, avant < ou après >, dans une plage a..b, ou last30d, thismonth",
    findsNoValue: "{column} n’a pas de valeur",
    helpFooter:
      "Les clés et les valeurs ignorent la casse. Séparez les valeurs par des virgules pour trouver l’une d’elles.",
    typeText: "Texte",
    typeNumber: "Nombre",
    typeDate: "Date",
    typeBoolean: "Oui ou non",
    typeOptions: "Options",
    columnsGroup: "Filtrer par colonne",
    matchingGroup: "Valeurs correspondantes",
    compareGroup: "Comparer",
    presetsGroup: "Préréglages",
    yearsGroup: "Années",
    monthsGroup: "Mois",
    dataRange: "De {min} à {max} ici",
    equalTo: "Égal à",
    moreThan: "Plus de",
    atLeast: "Au moins",
    lessThan: "Moins de",
    atMost: "Au plus",
    between: "Entre",
    before: "Avant",
    after: "Après",
    presetToday: "Aujourd’hui",
    presetYesterday: "Hier",
    presetThisMonth: "Ce mois-ci",
    presetLastMonth: "Le mois dernier",
    presetThisYear: "Cette année",
    presetLastYear: "L’année dernière",
    presetLastDays: {
      one: "{count} dernier jour",
      other: "{count} derniers jours",
    },
    presetLastWeeks: {
      one: "{count} dernière semaine",
      other: "{count} dernières semaines",
    },
    presetLastMonths: {
      one: "{count} dernier mois",
      other: "{count} derniers mois",
    },
    presetLastYears: {
      one: "{count} dernière année",
      other: "{count} dernières années",
    },
    pickDates: "Choisir des dates dans le calendrier",
    pickDay: "Choisir un jour dans le calendrier",
    calendarRange: "Choisissez un jour, ou un début et une fin",
    calendarBefore: "Avant le jour choisi",
    calendarAfter: "Après le jour choisi",
    calendarOnOrBefore: "Jusqu’au jour choisi inclus",
    calendarOnOrAfter: "À partir du jour choisi inclus",
    keyMove: "Déplacer",
    keySelect: "Choisir",
    keyComplete: "Compléter",
    keyClose: "Fermer",
    summaryFilters: "Filtres : {filters}.",
    summaryNoFilters: "Aucun filtre.",
    summarySearch: "Recherche : {search}.",
    summaryProblems: {
      one: "{count} problème : {problems}",
      other: "{count} problèmes : {problems}",
    },
    unknownColumn: "Aucune colonne ne s’appelle « {key} ».",
    unknownColumnSuggestion:
      "Aucune colonne ne s’appelle « {key} ». Vouliez-vous dire {suggestion} ?",
    columnNotFilterable: "{column} ne peut pas être filtré.",
    unknownValue: "{column} n’a pas de valeur « {value} ».",
    unknownValueSuggestion:
      "{column} n’a pas de valeur « {value} ». Vouliez-vous dire {suggestion} ?",
    notANumber: "« {value} » n’est pas un nombre.",
    badDate: "« {value} » n’est pas une date.",
    ambiguousNoYear: "« {value} » doit avoir une année, comme 2015-06-30.",
    ambiguousTwoDigitYear:
      "Écrivez l’année en entier : « {value} » peut se situer dans plusieurs siècles.",
    ambiguousMonth:
      "« {value} » peut désigner plusieurs mois : écrivez une plus grande partie du nom.",
    backwardsRange:
      "Cette plage commence après sa fin : {from} est après {to}.",
    unsupportedOr:
      "OR n’est pas pris en charge. Les lignes doivent correspondre à chaque terme. Pour trouver l’une de plusieurs valeurs d’une colonne, séparez-les par des virgules : {example}",
    unsupportedOrNoList:
      "OR n’est pas pris en charge. Les lignes doivent correspondre à chaque terme : cherchez une chose à la fois.",
    unsupportedMinus:
      "L’exclusion n’est pas prise en charge : ce terme est ignoré. Pour rechercher ce texte tel quel, mettez-le entre guillemets. Pour restreindre les lignes, filtrez plutôt les valeurs à garder : {example}",
    unsupportedMinusNoFilter:
      "L’exclusion n’est pas prise en charge : ce terme est ignoré. Pour rechercher ce texte tel quel, mettez-le entre guillemets.",
    exclusiveComparison: "Utilisez >= ou <= avec une date et une heure.",
    notComparable: "{column} n’a pas d’ordre : choisissez plutôt ses valeurs.",
    multipleBoolean: "{column} est oui ou non, pas les deux.",
    multipleDates: "{column} prend une date ou une plage, comme 2015..2016.",
    duplicateNoMatch:
      "Aucune ligne ne peut répondre aux deux termes sur {column}.",
    duplicateNotCombinable:
      "{column} est déjà filtré plus tôt dans la recherche : réunissez les deux dans un seul terme.",
  },
})
