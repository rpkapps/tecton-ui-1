/**
 * hr-HR strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Upisujte uvjete jedan uz drugi: vrijede svi. Uvjet je tekst za pretraživanje ili stupac i njegove vrijednosti. Odaberite primjer da biste ga dodali.",
    helpExample: "Primjer",
    helpFinds: "Pronalazi",
    findsWords: "Retci s ovim tekstom u bilo kojem stupcu",
    findsPhrase: "Navodnici drže riječi zajedno",
    findsText: "{column} sadrži tekst",
    findsOptions: "{column} je jedna od navedenih vrijednosti",
    findsBoolean: "{column} je da ili ne",
    findsNumber: "{column} uspoređeno s > >= < <= ili raspon a..b",
    findsDate:
      "{column} u godini, mjesecu ili danu, prije < ili poslije >, u rasponu a..b, ili last30d, thismonth",
    findsNoValue: "{column} nema vrijednost",
    helpFooter:
      "Ključevi i vrijednosti ne razlikuju velika i mala slova. Odvojite vrijednosti zarezima da biste pronašli bilo koju od njih.",
    typeText: "Tekst",
    typeNumber: "Broj",
    typeDate: "Datum",
    typeBoolean: "Da ili ne",
    typeOptions: "Mogućnosti",
    columnsGroup: "Filtriraj po stupcu",
    matchingGroup: "Odgovarajuće vrijednosti",
    compareGroup: "Usporedi",
    presetsGroup: "Unaprijed postavljeno",
    yearsGroup: "Godine",
    monthsGroup: "Mjeseci",
    dataRange: "Ovdje od {min} do {max}",
    moreThan: "Više od",
    atLeast: "Najmanje",
    lessThan: "Manje od",
    atMost: "Najviše",
    between: "Između",
    before: "Prije",
    after: "Poslije",
    presetToday: "Danas",
    presetYesterday: "Jučer",
    presetThisMonth: "Ovaj mjesec",
    presetLastMonth: "Prošli mjesec",
    presetThisYear: "Ova godina",
    presetLastYear: "Prošla godina",
    presetLastDays: {
      one: "Posljednji {count} dan",
      few: "Posljednja {count} dana",
      other: "Posljednjih {count} dana",
    },
    presetLastWeeks: {
      one: "Posljednji {count} tjedan",
      few: "Posljednja {count} tjedna",
      other: "Posljednjih {count} tjedana",
    },
    presetLastMonths: {
      one: "Posljednji {count} mjesec",
      few: "Posljednja {count} mjeseca",
      other: "Posljednjih {count} mjeseci",
    },
    presetLastYears: {
      one: "Posljednja {count} godina",
      few: "Posljednje {count} godine",
      other: "Posljednjih {count} godina",
    },
    pickDates: "Odaberi datume u kalendaru",
    pickDay: "Odaberi dan u kalendaru",
    calendarRange: "Odaberite dan ili početak i kraj",
    calendarBefore: "Prije odabranog dana",
    calendarAfter: "Poslije odabranog dana",
    calendarOnOrBefore: "Do odabranog dana uključivo",
    calendarOnOrAfter: "Od odabranog dana uključivo",
    keyMove: "Pomakni",
    keySelect: "Odaberi",
    keyComplete: "Dovrši",
    keyClose: "Zatvori",
    summaryFilters: "Filtri: {filters}.",
    summaryNoFilters: "Nema filtara.",
    summarySearch: "Pretraživanje: {search}.",
    summaryProblems: {
      one: "{count} problem: {problems}",
      few: "{count} problema: {problems}",
      other: "{count} problema: {problems}",
    },
    unknownColumn: "Nijedan stupac se ne zove „{key}”.",
    unknownColumnSuggestion:
      "Nijedan stupac se ne zove „{key}”. Jeste li mislili {suggestion}?",
    columnNotFilterable: "{column} se ne može filtrirati.",
    unknownValue: "{column} nema vrijednost „{value}”.",
    unknownValueSuggestion:
      "{column} nema vrijednost „{value}”. Jeste li mislili {suggestion}?",
    notANumber: "„{value}” nije broj.",
    badDate: "„{value}” nije datum.",
    ambiguousNoYear: "„{value}” treba godinu, npr. 2015-06-30.",
    ambiguousTwoDigitYear:
      "Napišite cijelu godinu: „{value}” može biti u više od jednog stoljeća.",
    ambiguousMonth:
      "„{value}” može biti više od jednog mjeseca: napišite više od naziva.",
    backwardsRange:
      "Ovaj raspon počinje nakon svojeg kraja: {from} je nakon {to}.",
    unsupportedOr:
      "OR nije podržan. Retci moraju zadovoljiti svaki uvjet. Da biste pronašli jednu od više vrijednosti stupca, navedite ih odvojene zarezima: {example}",
    unsupportedOrNoList:
      "OR nije podržan. Retci moraju zadovoljiti svaki uvjet, pa tražite jednu po jednu stvar.",
    unsupportedMinus:
      "Isključivanje nije podržano, pa se ovaj uvjet zanemaruje. Da biste pretražili upravo ovaj tekst, stavite ga u navodnike. Da biste suzili retke, umjesto toga filtrirajte vrijednosti koje želite zadržati: {example}",
    unsupportedMinusNoFilter:
      "Isključivanje nije podržano, pa se ovaj uvjet zanemaruje. Da biste pretražili upravo ovaj tekst, stavite ga u navodnike.",
    unsupportedNot:
      "Isključivanje nije podržano, pa se NOT zanemaruje, a uvjeti oko njega i dalje vrijede. Da biste suzili retke, umjesto toga filtrirajte vrijednosti koje želite zadržati: {example}",
    unsupportedNotNoFilter:
      "Isključivanje nije podržano, pa se NOT zanemaruje, a uvjeti oko njega i dalje vrijede.",
    exclusiveComparison: "Uz datum i vrijeme koristite >= ili <=.",
    notComparable:
      "{column} nema redoslijed: umjesto toga odaberite vrijednosti.",
    multipleBoolean: "{column} je da ili ne, ne oboje.",
    multipleDates:
      "{column} prima jedan datum ili jedan raspon, npr. 2015..2016.",
    duplicateNoMatch:
      "Nijedan redak ne može zadovoljiti oba uvjeta za {column}.",
    duplicateNotCombinable:
      "{column} se već filtrira ranije u pretraživanju: spojite oba u jedan uvjet.",
  },
})
