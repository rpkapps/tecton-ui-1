/**
 * es-ES strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Escribe términos uno al lado del otro: se aplican todos. Un término es un texto que buscar, o una columna y sus valores. Elige un ejemplo para añadirlo.",
    helpExample: "Ejemplo",
    helpFinds: "Encuentra",
    findsWords: "Filas con este texto en cualquier columna",
    findsPhrase: "Las comillas mantienen las palabras juntas",
    findsText: "{column} contiene el texto",
    findsOptions: "{column} es uno de los valores indicados",
    findsBoolean: "{column} es sí o no",
    findsNumber: "{column} comparado con > >= < <=, o un intervalo a..b",
    findsDate:
      "{column} en un año, un mes o un día, antes < o después >, en un intervalo a..b, o last30d, thismonth",
    findsNoValue: "{column} no tiene valor",
    helpFooter:
      "Las claves y los valores no distinguen mayúsculas. Separa valores con comas para encontrar cualquiera de ellos.",
    typeText: "Texto",
    typeNumber: "Número",
    typeDate: "Fecha",
    typeBoolean: "Sí o no",
    typeOptions: "Opciones",
    columnsGroup: "Filtrar por columna",
    matchingGroup: "Valores coincidentes",
    compareGroup: "Comparar",
    presetsGroup: "Predefinidos",
    yearsGroup: "Años",
    monthsGroup: "Meses",
    dataRange: "De {min} a {max} aquí",
    moreThan: "Más de",
    atLeast: "Al menos",
    lessThan: "Menos de",
    atMost: "Como máximo",
    between: "Entre",
    before: "Antes de",
    after: "Después de",
    presetToday: "Hoy",
    presetYesterday: "Ayer",
    presetThisMonth: "Este mes",
    presetLastMonth: "El mes pasado",
    presetThisYear: "Este año",
    presetLastYear: "El año pasado",
    presetLastDays: {
      one: "Último {count} día",
      other: "Últimos {count} días",
    },
    presetLastWeeks: {
      one: "Última {count} semana",
      other: "Últimas {count} semanas",
    },
    presetLastMonths: {
      one: "Último {count} mes",
      other: "Últimos {count} meses",
    },
    presetLastYears: {
      one: "Último {count} año",
      other: "Últimos {count} años",
    },
    pickDates: "Elegir fechas en el calendario",
    pickDay: "Elegir un día en el calendario",
    calendarRange: "Elige un día, o un inicio y un fin",
    calendarBefore: "Antes del día que elijas",
    calendarAfter: "Después del día que elijas",
    calendarOnOrBefore: "Hasta el día que elijas, incluido",
    calendarOnOrAfter: "Desde el día que elijas, incluido",
    keyMove: "Mover",
    keySelect: "Seleccionar",
    keyComplete: "Completar",
    keyClose: "Cerrar",
    footerAll: "Los términos juntos se aplican todos",
    summaryFilters: "Filtros: {filters}.",
    summaryNoFilters: "Sin filtros.",
    summarySearch: "Búsqueda: {search}.",
    summaryProblems: {
      one: "{count} problema: {problems}",
      other: "{count} problemas: {problems}",
    },
    unknownColumn: "Ninguna columna se llama «{key}».",
    unknownColumnSuggestion:
      "Ninguna columna se llama «{key}». ¿Quisiste decir {suggestion}?",
    columnNotFilterable: "{column} no se puede filtrar.",
    unknownValue: "{column} no tiene el valor «{value}».",
    unknownValueSuggestion:
      "{column} no tiene el valor «{value}». ¿Quisiste decir {suggestion}?",
    notANumber: "«{value}» no es un número.",
    badDate: "«{value}» no es una fecha.",
    ambiguousNoYear: "«{value}» necesita un año, como en 2015-06-30.",
    ambiguousTwoDigitYear:
      "Escribe el año completo: «{value}» podría estar en más de un siglo.",
    ambiguousMonth:
      "«{value}» podría ser más de un mes: escribe más letras del nombre.",
    backwardsRange:
      "Este intervalo empieza después de terminar: {from} es posterior a {to}.",
    unsupportedOr:
      "OR no se admite: se aplican todos los términos. Para encontrar cualquiera de varios valores, sepáralos con comas.",
    unsupportedNot:
      "No se admite excluir: filtra en su lugar los valores que quieras conservar. Para buscar este texto, ponlo entre comillas.",
    exclusiveComparison: "Usa >= o <= con una fecha y hora.",
    notComparable: "{column} no tiene orden: elige sus valores en su lugar.",
    multipleBoolean: "{column} es sí o no, no ambos.",
    multipleDates: "{column} admite una fecha o un intervalo, como 2015..2016.",
    duplicateNoMatch:
      "Ninguna fila puede cumplir los dos términos de {column}.",
    duplicateNotCombinable:
      "{column} ya se filtra antes en la búsqueda: une los dos en un solo término.",
  },
})
