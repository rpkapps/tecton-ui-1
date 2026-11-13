/**
 * lv-LV strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Rakstiet nosacījumus blakus: tiek piemēroti visi. Nosacījums ir meklējams teksts vai kolonna un tās vērtības. Izvēlieties piemēru, lai to pievienotu.",
    helpExample: "Piemērs",
    helpFinds: "Atrod",
    findsWords: "Rindas ar šo tekstu jebkurā kolonnā",
    findsPhrase: "Pēdiņas satur vārdus kopā",
    findsText: "{column} satur tekstu",
    findsOptions: "{column} ir viena no uzskaitītajām vērtībām",
    findsBoolean: "{column} ir jā vai nē",
    findsNumber: "{column} salīdzināta ar > >= < <= vai diapazons a..b",
    findsDate:
      "{column} gadā, mēnesī vai dienā, pirms < vai pēc >, diapazonā a..b, vai last30d, thismonth",
    findsNoValue: "{column} nav vērtības",
    helpFooter:
      "Atslēgas un vērtības nešķiro lielos un mazos burtus. Atdaliet vērtības ar komatiem, lai atrastu jebkuru no tām.",
    typeText: "Teksts",
    typeNumber: "Skaitlis",
    typeDate: "Datums",
    typeBoolean: "Jā vai nē",
    typeOptions: "Opcijas",
    columnsGroup: "Filtrēt pēc kolonnas",
    matchingGroup: "Atbilstošās vērtības",
    compareGroup: "Salīdzināt",
    presetsGroup: "Iepriekšiestatījumi",
    yearsGroup: "Gadi",
    monthsGroup: "Mēneši",
    dataRange: "Šeit no {min} līdz {max}",
    moreThan: "Vairāk nekā",
    atLeast: "Vismaz",
    lessThan: "Mazāk nekā",
    atMost: "Ne vairāk kā",
    between: "Starp",
    before: "Pirms",
    after: "Pēc",
    presetToday: "Šodien",
    presetYesterday: "Vakar",
    presetThisMonth: "Šis mēnesis",
    presetLastMonth: "Iepriekšējais mēnesis",
    presetThisYear: "Šis gads",
    presetLastYear: "Iepriekšējais gads",
    presetLastDays: {
      zero: "Pēdējās {count} dienas",
      one: "Pēdējā {count} diena",
      other: "Pēdējās {count} dienas",
    },
    presetLastWeeks: {
      zero: "Pēdējās {count} nedēļas",
      one: "Pēdējā {count} nedēļa",
      other: "Pēdējās {count} nedēļas",
    },
    presetLastMonths: {
      zero: "Pēdējie {count} mēneši",
      one: "Pēdējais {count} mēnesis",
      other: "Pēdējie {count} mēneši",
    },
    presetLastYears: {
      zero: "Pēdējie {count} gadi",
      one: "Pēdējais {count} gads",
      other: "Pēdējie {count} gadi",
    },
    pickDates: "Izvēlēties datumus kalendārā",
    pickDay: "Izvēlēties dienu kalendārā",
    calendarRange: "Izvēlieties dienu vai sākumu un beigas",
    calendarBefore: "Pirms izvēlētās dienas",
    calendarAfter: "Pēc izvēlētās dienas",
    calendarOnOrBefore: "Līdz izvēlētajai dienai ieskaitot",
    calendarOnOrAfter: "No izvēlētās dienas ieskaitot",
    keyMove: "Pārvietot",
    keySelect: "Atlasīt",
    keyComplete: "Pabeigt",
    keyClose: "Aizvērt",
    summaryFilters: "Filtri: {filters}.",
    summaryNoFilters: "Nav filtru.",
    summarySearch: "Meklēšana: {search}.",
    summaryProblems: {
      zero: "{count} problēmu: {problems}",
      one: "{count} problēma: {problems}",
      other: "{count} problēmas: {problems}",
    },
    unknownColumn: "Nav kolonnas “{key}”.",
    unknownColumnSuggestion: "Nav kolonnas “{key}”. Vai domājāt {suggestion}?",
    columnNotFilterable: "Kolonnu {column} nevar filtrēt.",
    unknownValue: "{column} nav vērtības “{value}”.",
    unknownValueSuggestion:
      "{column} nav vērtības “{value}”. Vai domājāt {suggestion}?",
    notANumber: "“{value}” nav skaitlis.",
    badDate: "“{value}” nav datums.",
    ambiguousNoYear: "“{value}” vajag gadu, piemēram, 2015-06-30.",
    ambiguousTwoDigitYear:
      "Rakstiet visu gadu: “{value}” var būt vairāk nekā vienā gadsimtā.",
    ambiguousMonth:
      "“{value}” var būt vairāk nekā viens mēnesis: uzrakstiet vairāk no nosaukuma.",
    backwardsRange: "Šis diapazons sākas pēc beigām: {from} ir pēc {to}.",
    unsupportedOr:
      "OR netiek atbalstīts. Rindām jāatbilst katram nosacījumam. Lai atrastu vienu no vairākām kolonnas vērtībām, uzskaitiet tās, atdalot ar komatiem: {example}",
    unsupportedOrNoList:
      "OR netiek atbalstīts. Rindām jāatbilst katram nosacījumam, tāpēc meklējiet vienu lietu vienlaikus.",
    unsupportedMinus:
      "Izslēgšana netiek atbalstīta, tāpēc šis nosacījums tiek ignorēts. Lai meklētu tieši šo tekstu, ielieciet to pēdiņās. Lai sašaurinātu rindas, tā vietā filtrējiet vērtības, kuras paturēt: {example}",
    unsupportedMinusNoFilter:
      "Izslēgšana netiek atbalstīta, tāpēc šis nosacījums tiek ignorēts. Lai meklētu tieši šo tekstu, ielieciet to pēdiņās.",
    unsupportedNot:
      "Izslēgšana netiek atbalstīta, tāpēc NOT tiek ignorēts, bet blakus esošie nosacījumi joprojām tiek piemēroti. Lai sašaurinātu rindas, tā vietā filtrējiet vērtības, kuras paturēt: {example}",
    unsupportedNotNoFilter:
      "Izslēgšana netiek atbalstīta, tāpēc NOT tiek ignorēts, bet blakus esošie nosacījumi joprojām tiek piemēroti.",
    exclusiveComparison: "Datumam ar laiku izmantojiet >= vai <=.",
    notComparable: "{column} nav secības: tā vietā izvēlieties vērtības.",
    multipleBoolean: "{column} ir jā vai nē, ne abi.",
    multipleDates:
      "{column} pieņem vienu datumu vai vienu diapazonu, piemēram, 2015..2016.",
    duplicateNoMatch:
      "Neviena rinda nevar atbilst abiem {column} nosacījumiem.",
    duplicateNotCombinable:
      "{column} jau tiek filtrēta agrāk meklēšanā: apvienojiet abus vienā nosacījumā.",
  },
})
