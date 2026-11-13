/**
 * it-IT strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Scrivi i termini uno accanto all’altro: si applicano tutti. Un termine è un testo da cercare, oppure una colonna e i suoi valori. Scegli un esempio per aggiungerlo.",
    helpExample: "Esempio",
    helpFinds: "Trova",
    findsWords: "Righe con questo testo in qualsiasi colonna",
    findsPhrase: "Le virgolette tengono insieme le parole",
    findsText: "{column} contiene il testo",
    findsOptions: "{column} è uno dei valori elencati",
    findsBoolean: "{column} è sì o no",
    findsNumber: "{column} confrontato con > >= < <=, o un intervallo a..b",
    findsDate:
      "{column} in un anno, un mese o un giorno, prima < o dopo >, in un intervallo a..b, o last30d, thismonth",
    findsNoValue: "{column} non ha valore",
    helpFooter:
      "Chiavi e valori non distinguono maiuscole e minuscole. Separa i valori con virgole per trovarne uno qualsiasi.",
    typeText: "Testo",
    typeNumber: "Numero",
    typeDate: "Data",
    typeBoolean: "Sì o no",
    typeOptions: "Opzioni",
    columnsGroup: "Filtra per colonna",
    matchingGroup: "Valori corrispondenti",
    compareGroup: "Confronta",
    presetsGroup: "Predefiniti",
    yearsGroup: "Anni",
    monthsGroup: "Mesi",
    dataRange: "Da {min} a {max} qui",
    moreThan: "Più di",
    atLeast: "Almeno",
    lessThan: "Meno di",
    atMost: "Al massimo",
    between: "Tra",
    before: "Prima",
    after: "Dopo",
    presetToday: "Oggi",
    presetYesterday: "Ieri",
    presetThisMonth: "Questo mese",
    presetLastMonth: "Mese scorso",
    presetThisYear: "Quest’anno",
    presetLastYear: "Anno scorso",
    presetLastDays: {
      one: "Ultimo {count} giorno",
      other: "Ultimi {count} giorni",
    },
    presetLastWeeks: {
      one: "Ultima {count} settimana",
      other: "Ultime {count} settimane",
    },
    presetLastMonths: {
      one: "Ultimo {count} mese",
      other: "Ultimi {count} mesi",
    },
    presetLastYears: {
      one: "Ultimo {count} anno",
      other: "Ultimi {count} anni",
    },
    pickDates: "Scegli le date sul calendario",
    pickDay: "Scegli un giorno sul calendario",
    calendarRange: "Scegli un giorno, o un inizio e una fine",
    calendarBefore: "Prima del giorno scelto",
    calendarAfter: "Dopo il giorno scelto",
    calendarOnOrBefore: "Fino al giorno scelto incluso",
    calendarOnOrAfter: "Dal giorno scelto incluso",
    keyMove: "Sposta",
    keySelect: "Seleziona",
    keyComplete: "Completa",
    keyClose: "Chiudi",
    footerAll: "I termini affiancati si applicano tutti",
    summaryFilters: "Filtri: {filters}.",
    summaryNoFilters: "Nessun filtro.",
    summarySearch: "Ricerca: {search}.",
    summaryProblems: {
      one: "{count} problema: {problems}",
      other: "{count} problemi: {problems}",
    },
    unknownColumn: "Nessuna colonna si chiama «{key}».",
    unknownColumnSuggestion:
      "Nessuna colonna si chiama «{key}». Intendevi {suggestion}?",
    columnNotFilterable: "{column} non può essere filtrato.",
    unknownValue: "{column} non ha il valore «{value}».",
    unknownValueSuggestion:
      "{column} non ha il valore «{value}». Intendevi {suggestion}?",
    notANumber: "«{value}» non è un numero.",
    badDate: "«{value}» non è una data.",
    ambiguousNoYear: "«{value}» richiede un anno, come in 2015-06-30.",
    ambiguousTwoDigitYear:
      "Scrivi l’anno per intero: «{value}» può cadere in più di un secolo.",
    ambiguousMonth:
      "«{value}» può indicare più di un mese: scrivi più lettere del nome.",
    backwardsRange:
      "Questo intervallo inizia dopo la fine: {from} è dopo {to}.",
    unsupportedOr:
      "OR non è supportato: si applicano tutti i termini. Per trovare uno tra più valori, separali con virgole.",
    unsupportedNot:
      "L’esclusione non è supportata: filtra invece i valori da tenere. Per cercare questo testo, mettilo tra virgolette.",
    exclusiveComparison: "Usa >= o <= con data e ora.",
    notComparable: "{column} non ha un ordine: scegli invece i suoi valori.",
    multipleBoolean: "{column} è sì o no, non entrambi.",
    multipleDates:
      "{column} accetta una data o un intervallo, come 2015..2016.",
    duplicateNoMatch:
      "Nessuna riga può soddisfare entrambi i termini su {column}.",
    duplicateNotCombinable:
      "{column} è già filtrato prima nella ricerca: unisci i due in un solo termine.",
  },
})
