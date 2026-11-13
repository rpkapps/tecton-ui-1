/**
 * fi-FI strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Kirjoita hakuehdot vierekkäin: jokainen ehto pätee. Ehto on haettava teksti tai sarake ja sen arvot. Lisää esimerkki valitsemalla se.",
    helpExample: "Esimerkki",
    helpFinds: "Löytää",
    findsWords: "Rivit, joiden jossakin sarakkeessa on tämä teksti",
    findsPhrase: "Lainausmerkit pitävät sanat yhdessä",
    findsText: "{column} sisältää tekstin",
    findsOptions: "{column} on jokin luetelluista arvoista",
    findsBoolean: "{column} on kyllä tai ei",
    findsNumber: "{column} verrattuna > >= < <= tai väli a..b",
    findsDate:
      "{column} vuonna, kuukautena tai päivänä, ennen < tai jälkeen >, välillä a..b, tai last30d, thismonth",
    findsNoValue: "{column}: ei arvoa",
    helpFooter:
      "Avaimissa ja arvoissa kirjainkoolla ei ole väliä. Erota arvot pilkuilla löytääksesi minkä tahansa niistä.",
    typeText: "Teksti",
    typeNumber: "Luku",
    typeDate: "Päivämäärä",
    typeBoolean: "Kyllä tai ei",
    typeOptions: "Vaihtoehdot",
    columnsGroup: "Suodata sarakkeen mukaan",
    matchingGroup: "Vastaavat arvot",
    compareGroup: "Vertaa",
    presetsGroup: "Valmiit valinnat",
    yearsGroup: "Vuodet",
    monthsGroup: "Kuukaudet",
    dataRange: "{min}–{max} tässä",
    moreThan: "Enemmän kuin",
    atLeast: "Vähintään",
    lessThan: "Vähemmän kuin",
    atMost: "Enintään",
    between: "Välillä",
    before: "Ennen",
    after: "Jälkeen",
    presetToday: "Tänään",
    presetYesterday: "Eilen",
    presetThisMonth: "Tämä kuukausi",
    presetLastMonth: "Edellinen kuukausi",
    presetThisYear: "Tämä vuosi",
    presetLastYear: "Edellinen vuosi",
    presetLastDays: {
      one: "Viimeinen {count} päivä",
      other: "Viimeiset {count} päivää",
    },
    presetLastWeeks: {
      one: "Viimeinen {count} viikko",
      other: "Viimeiset {count} viikkoa",
    },
    presetLastMonths: {
      one: "Viimeinen {count} kuukausi",
      other: "Viimeiset {count} kuukautta",
    },
    presetLastYears: {
      one: "Viimeinen {count} vuosi",
      other: "Viimeiset {count} vuotta",
    },
    pickDates: "Valitse päivämäärät kalenterista",
    pickDay: "Valitse päivä kalenterista",
    calendarRange: "Valitse päivä tai alku ja loppu",
    calendarBefore: "Ennen valitsemaasi päivää",
    calendarAfter: "Valitsemasi päivän jälkeen",
    calendarOnOrBefore: "Valitsemaasi päivään asti",
    calendarOnOrAfter: "Valitsemastasi päivästä alkaen",
    keyMove: "Siirry",
    keySelect: "Valitse",
    keyComplete: "Täydennä",
    keyClose: "Sulje",
    summaryFilters: "Suodattimet: {filters}.",
    summaryNoFilters: "Ei suodattimia.",
    summarySearch: "Haku: {search}.",
    summaryProblems: {
      one: "{count} ongelma: {problems}",
      other: "{count} ongelmaa: {problems}",
    },
    unknownColumn: "Saraketta ”{key}” ei ole.",
    unknownColumnSuggestion:
      "Saraketta ”{key}” ei ole. Tarkoititko {suggestion}?",
    columnNotFilterable: "Saraketta {column} ei voi suodattaa.",
    unknownValue: "Sarakkeella {column} ei ole arvoa ”{value}”.",
    unknownValueSuggestion:
      "Sarakkeella {column} ei ole arvoa ”{value}”. Tarkoititko {suggestion}?",
    notANumber: "”{value}” ei ole luku.",
    badDate: "”{value}” ei ole päivämäärä.",
    ambiguousNoYear: "”{value}” tarvitsee vuoden, kuten 2015-06-30.",
    ambiguousTwoDigitYear:
      "Kirjoita vuosi kokonaan: ”{value}” voi osua useammalle vuosisadalle.",
    ambiguousMonth:
      "”{value}” voi olla useampi kuukausi: kirjoita nimeä pidemmälle.",
    backwardsRange:
      "Väli alkaa loppunsa jälkeen: {from} on myöhemmin kuin {to}.",
    unsupportedOr:
      "OR ei ole tuettu. Rivien on täytettävä jokainen ehto. Jos haluat löytää jonkin sarakkeen useista arvoista, kirjoita ne pilkuilla erotettuina: {example}",
    unsupportedOrNoList:
      "OR ei ole tuettu. Rivien on täytettävä jokainen ehto, joten hae yhtä asiaa kerrallaan.",
    unsupportedMinus:
      "Poissulkeminen ei ole tuettu, joten tämä ehto ohitetaan. Jos haluat hakea juuri tätä tekstiä, laita se lainausmerkkeihin. Jos haluat rajata rivejä, suodata sen sijaan säilytettävät arvot: {example}",
    unsupportedMinusNoFilter:
      "Poissulkeminen ei ole tuettu, joten tämä ehto ohitetaan. Jos haluat hakea juuri tätä tekstiä, laita se lainausmerkkeihin.",
    unsupportedNot:
      "Poissulkeminen ei ole tuettu, joten NOT ohitetaan ja sen vieressä olevat ehdot pätevät edelleen. Jos haluat rajata rivejä, suodata sen sijaan säilytettävät arvot: {example}",
    unsupportedNotNoFilter:
      "Poissulkeminen ei ole tuettu, joten NOT ohitetaan ja sen vieressä olevat ehdot pätevät edelleen.",
    exclusiveComparison:
      "Käytä päivämäärän ja kellonajan kanssa merkkejä >= tai <=.",
    notComparable:
      "Sarakkeella {column} ei ole järjestystä: valitse sen sijaan arvot.",
    multipleBoolean: "{column} on kyllä tai ei, ei molempia.",
    multipleDates:
      "{column} ottaa yhden päivämäärän tai yhden välin, kuten 2015..2016.",
    duplicateNoMatch:
      "Mikään rivi ei voi täyttää molempia sarakkeen {column} ehtoja.",
    duplicateNotCombinable:
      "{column} suodatetaan jo aiemmin haussa: kirjoita molemmat samaan ehtoon.",
  },
})
