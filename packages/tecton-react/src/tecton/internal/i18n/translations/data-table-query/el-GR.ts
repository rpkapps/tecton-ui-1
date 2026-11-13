/**
 * el-GR strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Πληκτρολογήστε όρους τον έναν δίπλα στον άλλο: ισχύουν όλοι. Ένας όρος είναι κείμενο για αναζήτηση ή μια στήλη και οι τιμές της. Επιλέξτε ένα παράδειγμα για να το προσθέσετε.",
    helpExample: "Παράδειγμα",
    helpFinds: "Βρίσκει",
    findsWords: "Γραμμές με αυτό το κείμενο σε οποιαδήποτε στήλη",
    findsPhrase: "Τα εισαγωγικά κρατούν τις λέξεις μαζί",
    findsText: "{column} περιέχει το κείμενο",
    findsOptions: "{column} είναι μία από τις τιμές της λίστας",
    findsBoolean: "{column} είναι ναι ή όχι",
    findsNumber: "{column} σε σύγκριση με > >= < <= ή εύρος a..b",
    findsDate:
      "{column} σε έτος, μήνα ή ημέρα, πριν από < ή μετά από >, σε εύρος a..b, ή last30d, thismonth",
    findsNoValue: "{column} χωρίς τιμή",
    helpFooter:
      "Τα κλειδιά και οι τιμές αγνοούν πεζά-κεφαλαία. Διαχωρίστε τιμές με κόμματα για να βρείτε οποιαδήποτε από αυτές.",
    typeText: "Κείμενο",
    typeNumber: "Αριθμός",
    typeDate: "Ημερομηνία",
    typeBoolean: "Ναι ή όχι",
    typeOptions: "Επιλογές",
    columnsGroup: "Φιλτράρισμα κατά στήλη",
    matchingGroup: "Αντίστοιχες τιμές",
    compareGroup: "Σύγκριση",
    presetsGroup: "Προεπιλογές",
    yearsGroup: "Έτη",
    monthsGroup: "Μήνες",
    dataRange: "Εδώ από {min} έως {max}",
    moreThan: "Περισσότερο από",
    atLeast: "Τουλάχιστον",
    lessThan: "Λιγότερο από",
    atMost: "Το πολύ",
    between: "Μεταξύ",
    before: "Πριν από",
    after: "Μετά από",
    presetToday: "Σήμερα",
    presetYesterday: "Χθες",
    presetThisMonth: "Αυτός ο μήνας",
    presetLastMonth: "Προηγούμενος μήνας",
    presetThisYear: "Φέτος",
    presetLastYear: "Πέρυσι",
    presetLastDays: {
      one: "Τελευταία {count} ημέρα",
      other: "Τελευταίες {count} ημέρες",
    },
    presetLastWeeks: {
      one: "Τελευταία {count} εβδομάδα",
      other: "Τελευταίες {count} εβδομάδες",
    },
    presetLastMonths: {
      one: "Τελευταίος {count} μήνας",
      other: "Τελευταίοι {count} μήνες",
    },
    presetLastYears: {
      one: "Τελευταίο {count} έτος",
      other: "Τελευταία {count} έτη",
    },
    pickDates: "Επιλογή ημερομηνιών στο ημερολόγιο",
    pickDay: "Επιλογή ημέρας στο ημερολόγιο",
    calendarRange: "Επιλέξτε μια ημέρα ή μια αρχή και ένα τέλος",
    calendarBefore: "Πριν από την ημέρα που επιλέγετε",
    calendarAfter: "Μετά από την ημέρα που επιλέγετε",
    calendarOnOrBefore: "Έως και την ημέρα που επιλέγετε",
    calendarOnOrAfter: "Από και την ημέρα που επιλέγετε",
    keyMove: "Μετακίνηση",
    keySelect: "Επιλογή",
    keyComplete: "Συμπλήρωση",
    keyClose: "Κλείσιμο",
    footerAll: "Οι όροι δίπλα-δίπλα ισχύουν όλοι",
    summaryFilters: "Φίλτρα: {filters}.",
    summaryNoFilters: "Χωρίς φίλτρα.",
    summarySearch: "Αναζήτηση: {search}.",
    summaryProblems: {
      one: "{count} πρόβλημα: {problems}",
      other: "{count} προβλήματα: {problems}",
    },
    unknownColumn: "Καμία στήλη δεν ονομάζεται «{key}».",
    unknownColumnSuggestion:
      "Καμία στήλη δεν ονομάζεται «{key}». Μήπως εννοείτε {suggestion};",
    columnNotFilterable: "Η στήλη {column} δεν φιλτράρεται.",
    unknownValue: "Η στήλη {column} δεν έχει τιμή «{value}».",
    unknownValueSuggestion:
      "Η στήλη {column} δεν έχει τιμή «{value}». Μήπως εννοείτε {suggestion};",
    notANumber: "Το «{value}» δεν είναι αριθμός.",
    badDate: "Το «{value}» δεν είναι ημερομηνία.",
    ambiguousNoYear: "Το «{value}» χρειάζεται έτος, π.χ. 2015-06-30.",
    ambiguousTwoDigitYear:
      "Γράψτε ολόκληρο το έτος: το «{value}» μπορεί να ανήκει σε περισσότερους από έναν αιώνες.",
    ambiguousMonth:
      "Το «{value}» μπορεί να είναι περισσότεροι από ένας μήνες: γράψτε περισσότερο από το όνομα.",
    backwardsRange:
      "Αυτό το εύρος ξεκινά μετά το τέλος του: το {from} είναι μετά το {to}.",
    unsupportedOr:
      "Το OR δεν υποστηρίζεται: ισχύουν όλοι οι όροι. Για να βρείτε οποιαδήποτε από πολλές τιμές, διαχωρίστε τις με κόμματα.",
    unsupportedNot:
      "Ο αποκλεισμός δεν υποστηρίζεται: φιλτράρετε αντ’ αυτού τις τιμές που θα μείνουν. Για να αναζητήσετε αυτό το κείμενο, βάλτε το σε εισαγωγικά.",
    exclusiveComparison: "Με ημερομηνία και ώρα χρησιμοποιήστε >= ή <=.",
    notComparable:
      "Η στήλη {column} δεν έχει σειρά: επιλέξτε αντ’ αυτού τιμές.",
    multipleBoolean: "{column} είναι ναι ή όχι, όχι και τα δύο.",
    multipleDates:
      "{column} δέχεται μία ημερομηνία ή ένα εύρος, π.χ. 2015..2016.",
    duplicateNoMatch:
      "Καμία γραμμή δεν ικανοποιεί και τους δύο όρους για {column}.",
    duplicateNotCombinable:
      "Η στήλη {column} φιλτράρεται ήδη νωρίτερα στην αναζήτηση: γράψτε και τα δύο σε έναν όρο.",
  },
})
