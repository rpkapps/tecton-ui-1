/**
 * pt-PT strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Digite termos lado a lado: todos se aplicam. Um termo é um texto a pesquisar, ou uma coluna e os seus valores. Escolha um exemplo para o adicionar.",
    helpExample: "Exemplo",
    helpFinds: "Encontra",
    findsWords: "Linhas com este texto em qualquer coluna",
    findsPhrase: "As aspas mantêm as palavras juntas",
    findsText: "{column} contém o texto",
    findsOptions: "{column} é um dos valores listados",
    findsBoolean: "{column} é sim ou não",
    findsNumber: "{column} comparado com > >= < <=, ou um intervalo a..b",
    findsDate:
      "{column} num ano, num mês ou num dia, antes < ou depois >, num intervalo a..b, ou last30d, thismonth",
    findsNoValue: "{column} não tem valor",
    helpFooter:
      "Chaves e valores ignoram maiúsculas e minúsculas. Separe valores com vírgulas para encontrar qualquer um deles.",
    typeText: "Texto",
    typeNumber: "Número",
    typeDate: "Data",
    typeBoolean: "Sim ou não",
    typeOptions: "Opções",
    columnsGroup: "Filtrar por coluna",
    matchingGroup: "Valores correspondentes",
    compareGroup: "Comparar",
    presetsGroup: "Predefinições",
    yearsGroup: "Anos",
    monthsGroup: "Meses",
    dataRange: "De {min} a {max} aqui",
    moreThan: "Mais de",
    atLeast: "Pelo menos",
    lessThan: "Menos de",
    atMost: "No máximo",
    between: "Entre",
    before: "Antes de",
    after: "Depois de",
    presetToday: "Hoje",
    presetYesterday: "Ontem",
    presetThisMonth: "Este mês",
    presetLastMonth: "Mês passado",
    presetThisYear: "Este ano",
    presetLastYear: "Ano passado",
    presetLastDays: {
      one: "Último {count} dia",
      other: "Últimos {count} dias",
    },
    presetLastWeeks: {
      one: "Última {count} semana",
      other: "Últimas {count} semanas",
    },
    presetLastMonths: {
      one: "Último {count} mês",
      other: "Últimos {count} meses",
    },
    presetLastYears: {
      one: "Último {count} ano",
      other: "Últimos {count} anos",
    },
    pickDates: "Escolher datas no calendário",
    pickDay: "Escolher um dia no calendário",
    calendarRange: "Escolha um dia, ou um início e um fim",
    calendarBefore: "Antes do dia escolhido",
    calendarAfter: "Depois do dia escolhido",
    calendarOnOrBefore: "Até ao dia escolhido, inclusive",
    calendarOnOrAfter: "A partir do dia escolhido, inclusive",
    keyMove: "Mover",
    keySelect: "Selecionar",
    keyComplete: "Completar",
    keyClose: "Fechar",
    footerAll: "Os termos lado a lado aplicam-se todos",
    summaryFilters: "Filtros: {filters}.",
    summaryNoFilters: "Sem filtros.",
    summarySearch: "Pesquisa: {search}.",
    summaryProblems: {
      one: "{count} problema: {problems}",
      other: "{count} problemas: {problems}",
    },
    unknownColumn: "Nenhuma coluna se chama “{key}”.",
    unknownColumnSuggestion:
      "Nenhuma coluna se chama “{key}”. Queria dizer {suggestion}?",
    columnNotFilterable: "{column} não pode ser filtrado.",
    unknownValue: "{column} não tem o valor “{value}”.",
    unknownValueSuggestion:
      "{column} não tem o valor “{value}”. Queria dizer {suggestion}?",
    notANumber: "“{value}” não é um número.",
    badDate: "“{value}” não é uma data.",
    ambiguousNoYear: "“{value}” precisa de um ano, como em 2015-06-30.",
    ambiguousTwoDigitYear:
      "Escreva o ano completo: “{value}” pode estar em mais de um século.",
    ambiguousMonth:
      "“{value}” pode ser mais de um mês: escreva mais letras do nome.",
    backwardsRange:
      "Este intervalo começa depois de acabar: {from} é depois de {to}.",
    unsupportedOr:
      "OR não é suportado: todos os termos se aplicam. Para encontrar qualquer um de vários valores, separe-os com vírgulas.",
    unsupportedNot:
      "A exclusão não é suportada: filtre os valores a manter. Para pesquisar este texto, coloque-o entre aspas.",
    exclusiveComparison: "Use >= ou <= com uma data e hora.",
    notComparable: "{column} não tem ordem: escolha os seus valores.",
    multipleBoolean: "{column} é sim ou não, não ambos.",
    multipleDates: "{column} aceita uma data ou um intervalo, como 2015..2016.",
    duplicateNoMatch: "Nenhuma linha pode cumprir os dois termos de {column}.",
    duplicateNotCombinable:
      "{column} já é filtrado antes na pesquisa: junte os dois num só termo.",
  },
})
