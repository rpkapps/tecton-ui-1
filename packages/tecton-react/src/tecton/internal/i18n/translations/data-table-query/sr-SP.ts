/**
 * sr-SP strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Upisujte uslove jedan pored drugog: važe svi. Uslov je tekst za pretragu ili kolona i njene vrednosti. Izaberite primer da biste ga dodali.",
    helpExample: "Primer",
    helpFinds: "Pronalazi",
    findsWords: "Redovi sa ovim tekstom u bilo kojoj koloni",
    findsPhrase: "Navodnici drže reči zajedno",
    findsText: "{column} sadrži tekst",
    findsOptions: "{column} je jedna od navedenih vrednosti",
    findsBoolean: "{column} je da ili ne",
    findsNumber: "{column} upoređeno sa > >= < <= ili opseg a..b",
    findsDate:
      "{column} u godini, mesecu ili danu, pre < ili posle >, u opsegu a..b, ili last30d, thismonth",
    findsNoValue: "{column} nema vrednost",
    helpFooter:
      "Ključevi i vrednosti ne razlikuju velika i mala slova. Odvojite vrednosti zarezima da biste pronašli bilo koju od njih.",
    typeText: "Tekst",
    typeNumber: "Broj",
    typeDate: "Datum",
    typeBoolean: "Da ili ne",
    typeOptions: "Opcije",
    columnsGroup: "Filtriraj po koloni",
    matchingGroup: "Odgovarajuće vrednosti",
    compareGroup: "Uporedi",
    presetsGroup: "Unapred podešeno",
    yearsGroup: "Godine",
    monthsGroup: "Meseci",
    dataRange: "Ovde od {min} do {max}",
    moreThan: "Više od",
    atLeast: "Najmanje",
    lessThan: "Manje od",
    atMost: "Najviše",
    between: "Između",
    before: "Pre",
    after: "Posle",
    presetToday: "Danas",
    presetYesterday: "Juče",
    presetThisMonth: "Ovaj mesec",
    presetLastMonth: "Prošli mesec",
    presetThisYear: "Ova godina",
    presetLastYear: "Prošla godina",
    presetLastDays: {
      one: "Poslednji {count} dan",
      few: "Poslednja {count} dana",
      other: "Poslednjih {count} dana",
    },
    presetLastWeeks: {
      one: "Poslednja {count} nedelja",
      few: "Poslednje {count} nedelje",
      other: "Poslednjih {count} nedelja",
    },
    presetLastMonths: {
      one: "Poslednji {count} mesec",
      few: "Poslednja {count} meseca",
      other: "Poslednjih {count} meseci",
    },
    presetLastYears: {
      one: "Poslednja {count} godina",
      few: "Poslednje {count} godine",
      other: "Poslednjih {count} godina",
    },
    pickDates: "Izaberi datume u kalendaru",
    pickDay: "Izaberi dan u kalendaru",
    calendarRange: "Izaberite dan ili početak i kraj",
    calendarBefore: "Pre izabranog dana",
    calendarAfter: "Posle izabranog dana",
    calendarOnOrBefore: "Do izabranog dana uključujući",
    calendarOnOrAfter: "Od izabranog dana uključujući",
    keyMove: "Pomeri",
    keySelect: "Izaberi",
    keyComplete: "Dovrši",
    keyClose: "Zatvori",
    summaryFilters: "Filteri: {filters}.",
    summaryNoFilters: "Nema filtera.",
    summarySearch: "Pretraga: {search}.",
    summaryProblems: {
      one: "{count} problem: {problems}",
      few: "{count} problema: {problems}",
      other: "{count} problema: {problems}",
    },
    unknownColumn: "Nijedna kolona se ne zove „{key}”.",
    unknownColumnSuggestion:
      "Nijedna kolona se ne zove „{key}”. Da li ste mislili {suggestion}?",
    columnNotFilterable: "{column} ne može da se filtrira.",
    unknownValue: "{column} nema vrednost „{value}”.",
    unknownValueSuggestion:
      "{column} nema vrednost „{value}”. Da li ste mislili {suggestion}?",
    notANumber: "„{value}” nije broj.",
    badDate: "„{value}” nije datum.",
    ambiguousNoYear: "„{value}” treba godinu, npr. 2015-06-30.",
    ambiguousTwoDigitYear:
      "Napišite celu godinu: „{value}” može biti u više od jednog veka.",
    ambiguousMonth:
      "„{value}” može biti više od jednog meseca: napišite više od naziva.",
    backwardsRange:
      "Ovaj opseg počinje posle svog kraja: {from} je posle {to}.",
    unsupportedOr:
      "OR nije podržan. Redovi moraju da ispune svaki uslov. Da biste pronašli jednu od više vrednosti kolone, navedite ih odvojene zarezima: {example}",
    unsupportedOrNoList:
      "OR nije podržan. Redovi moraju da ispune svaki uslov, pa tražite jednu po jednu stvar.",
    unsupportedMinus:
      "Isključivanje nije podržano, pa se ovaj uslov zanemaruje. Da biste pretražili baš ovaj tekst, stavite ga u navodnike. Da biste suzili redove, umesto toga filtrirajte vrednosti koje želite da zadržite: {example}",
    unsupportedMinusNoFilter:
      "Isključivanje nije podržano, pa se ovaj uslov zanemaruje. Da biste pretražili baš ovaj tekst, stavite ga u navodnike.",
    exclusiveComparison: "Uz datum i vreme koristite >= ili <=.",
    notComparable: "{column} nema redosled: umesto toga izaberite vrednosti.",
    multipleBoolean: "{column} je da ili ne, ne oboje.",
    multipleDates:
      "{column} prima jedan datum ili jedan opseg, npr. 2015..2016.",
    duplicateNoMatch: "Nijedan red ne može da ispuni oba uslova za {column}.",
    duplicateNotCombinable:
      "{column} se već filtrira ranije u pretrazi: spojite oba u jedan uslov.",
  },
})
