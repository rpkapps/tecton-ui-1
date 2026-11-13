/**
 * hu-HU strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Írja a feltételeket egymás mellé: mindegyik érvényes. Egy feltétel kereshető szöveg, vagy egy oszlop és az értékei. Válasszon egy példát a hozzáadásához.",
    helpExample: "Példa",
    helpFinds: "Talál",
    findsWords: "Sorok ezzel a szöveggel bármelyik oszlopban",
    findsPhrase: "Az idézőjelek összetartják a szavakat",
    findsText: "{column} tartalmazza a szöveget",
    findsOptions: "{column} a felsorolt értékek egyike",
    findsBoolean: "{column} igen vagy nem",
    findsNumber: "{column} összevetve: > >= < <=, vagy tartomány a..b",
    findsDate:
      "{column} egy évben, hónapban vagy napon, előtte < vagy utána >, tartományban a..b, vagy last30d, thismonth",
    findsNoValue: "{column}: nincs érték",
    helpFooter:
      "A kulcsok és értékek nem különböztetik meg a kis- és nagybetűket. Válassza el az értékeket vesszővel bármelyikük kereséséhez.",
    typeText: "Szöveg",
    typeNumber: "Szám",
    typeDate: "Dátum",
    typeBoolean: "Igen vagy nem",
    typeOptions: "Lehetőségek",
    columnsGroup: "Szűrés oszlop szerint",
    matchingGroup: "Egyező értékek",
    compareGroup: "Összehasonlítás",
    presetsGroup: "Előbeállítások",
    yearsGroup: "Évek",
    monthsGroup: "Hónapok",
    dataRange: "Itt {min} és {max} között",
    moreThan: "Több mint",
    atLeast: "Legalább",
    lessThan: "Kevesebb mint",
    atMost: "Legfeljebb",
    between: "Között",
    before: "Előtte",
    after: "Utána",
    presetToday: "Ma",
    presetYesterday: "Tegnap",
    presetThisMonth: "Ez a hónap",
    presetLastMonth: "Előző hónap",
    presetThisYear: "Idei év",
    presetLastYear: "Tavalyi év",
    presetLastDays: { one: "Utolsó {count} nap", other: "Utolsó {count} nap" },
    presetLastWeeks: { one: "Utolsó {count} hét", other: "Utolsó {count} hét" },
    presetLastMonths: {
      one: "Utolsó {count} hónap",
      other: "Utolsó {count} hónap",
    },
    presetLastYears: { one: "Utolsó {count} év", other: "Utolsó {count} év" },
    pickDates: "Dátumok kiválasztása a naptárban",
    pickDay: "Nap kiválasztása a naptárban",
    calendarRange: "Válasszon egy napot, vagy egy kezdetet és egy véget",
    calendarBefore: "A kiválasztott nap előtt",
    calendarAfter: "A kiválasztott nap után",
    calendarOnOrBefore: "A kiválasztott napig bezárólag",
    calendarOnOrAfter: "A kiválasztott naptól kezdve",
    keyMove: "Mozgatás",
    keySelect: "Kijelölés",
    keyComplete: "Kiegészítés",
    keyClose: "Bezárás",
    footerAll: "Az egymás melletti feltételek mind érvényesek",
    summaryFilters: "Szűrők: {filters}.",
    summaryNoFilters: "Nincsenek szűrők.",
    summarySearch: "Keresés: {search}.",
    summaryProblems: {
      one: "{count} probléma: {problems}",
      other: "{count} probléma: {problems}",
    },
    unknownColumn: "Nincs „{key}” nevű oszlop.",
    unknownColumnSuggestion:
      "Nincs „{key}” nevű oszlop. Erre gondolt: {suggestion}?",
    columnNotFilterable: "A(z) {column} oszlop nem szűrhető.",
    unknownValue: "A(z) {column} oszlopnak nincs „{value}” értéke.",
    unknownValueSuggestion:
      "A(z) {column} oszlopnak nincs „{value}” értéke. Erre gondolt: {suggestion}?",
    notANumber: "„{value}” nem szám.",
    badDate: "„{value}” nem dátum.",
    ambiguousNoYear: "„{value}” évet igényel, például 2015-06-30.",
    ambiguousTwoDigitYear:
      "Írja ki teljesen az évet: „{value}” több évszázadba is eshet.",
    ambiguousMonth: "„{value}” több hónap is lehet: írjon többet a nevéből.",
    backwardsRange:
      "Ez a tartomány a vége után kezdődik: {from} későbbi, mint {to}.",
    unsupportedOr:
      "Az OR nem támogatott: minden feltétel érvényes. Több érték bármelyikének kereséséhez válassza el őket vesszővel.",
    unsupportedNot:
      "A kizárás nem támogatott: inkább a megtartandó értékekre szűrjön. A szöveg kereséséhez tegye idézőjelbe.",
    exclusiveComparison: "Dátummal és idővel használja a >= vagy <= jelet.",
    notComparable:
      "A(z) {column} oszlopnak nincs sorrendje: inkább válassza ki az értékeit.",
    multipleBoolean: "{column}: igen vagy nem, nem mindkettő.",
    multipleDates:
      "{column}: egy dátum vagy egy tartomány adható meg, például 2015..2016.",
    duplicateNoMatch:
      "Egyetlen sor sem felelhet meg a(z) {column} mindkét feltételének.",
    duplicateNotCombinable:
      "A(z) {column} oszlopot a keresés már korábban szűri: írja a kettőt egy feltételbe.",
  },
})
