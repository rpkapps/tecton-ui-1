/**
 * tr-TR strings of `DataTableSearch syntax="query"`, a deferred namespace
 * (`../../translations.ts`): loaded with the query field when a
 * `TectonProvider` uses this locale.
 */
import { defineTranslations } from "../../translations"

export default defineTranslations({
  dataTableQuery: {
    helpDescription:
      "Koşulları yan yana yazın: hepsi uygulanır. Koşul, aranacak bir metin ya da bir sütun ve değerleridir. Eklemek için bir örnek seçin.",
    helpExample: "Örnek",
    helpFinds: "Bulur",
    findsWords: "Herhangi bir sütunda bu metni içeren satırlar",
    findsPhrase: "Tırnak işaretleri sözcükleri bir arada tutar",
    findsText: "{column} metni içerir",
    findsOptions: "{column} listelenen değerlerden biridir",
    findsBoolean: "{column} evet ya da hayırdır",
    findsNumber: "{column} > >= < <= ile karşılaştırılır veya a..b aralığı",
    findsDate:
      "{column} bir yılda, ayda veya günde, önce < veya sonra >, a..b aralığında ya da last30d, thismonth",
    findsNoValue: "{column} değeri yok",
    helpFooter:
      "Anahtarlar ve değerler büyük/küçük harf ayırmaz. Herhangi birini bulmak için değerleri virgülle ayırın.",
    typeText: "Metin",
    typeNumber: "Sayı",
    typeDate: "Tarih",
    typeBoolean: "Evet ya da hayır",
    typeOptions: "Seçenekler",
    columnsGroup: "Sütuna göre filtrele",
    matchingGroup: "Eşleşen değerler",
    compareGroup: "Karşılaştır",
    presetsGroup: "Hazır ayarlar",
    yearsGroup: "Yıllar",
    monthsGroup: "Aylar",
    dataRange: "Burada {min} ile {max} arası",
    moreThan: "Şundan fazla",
    atLeast: "En az",
    lessThan: "Şundan az",
    atMost: "En çok",
    between: "Arasında",
    before: "Önce",
    after: "Sonra",
    presetToday: "Bugün",
    presetYesterday: "Dün",
    presetThisMonth: "Bu ay",
    presetLastMonth: "Geçen ay",
    presetThisYear: "Bu yıl",
    presetLastYear: "Geçen yıl",
    presetLastDays: { one: "Son {count} gün", other: "Son {count} gün" },
    presetLastWeeks: { one: "Son {count} hafta", other: "Son {count} hafta" },
    presetLastMonths: { one: "Son {count} ay", other: "Son {count} ay" },
    presetLastYears: { one: "Son {count} yıl", other: "Son {count} yıl" },
    pickDates: "Takvimden tarih seç",
    pickDay: "Takvimden gün seç",
    calendarRange: "Bir gün ya da bir başlangıç ve bitiş seçin",
    calendarBefore: "Seçtiğiniz günden önce",
    calendarAfter: "Seçtiğiniz günden sonra",
    calendarOnOrBefore: "Seçtiğiniz gün dahil ona kadar",
    calendarOnOrAfter: "Seçtiğiniz gün dahil ondan itibaren",
    keyMove: "Taşı",
    keySelect: "Seç",
    keyComplete: "Tamamla",
    keyClose: "Kapat",
    summaryFilters: "Filtreler: {filters}.",
    summaryNoFilters: "Filtre yok.",
    summarySearch: "Arama: {search}.",
    summaryProblems: {
      one: "{count} sorun: {problems}",
      other: "{count} sorun: {problems}",
    },
    unknownColumn: "“{key}” adında sütun yok.",
    unknownColumnSuggestion:
      "“{key}” adında sütun yok. {suggestion} mı demek istediniz?",
    columnNotFilterable: "{column} filtrelenemez.",
    unknownValue: "{column} için “{value}” değeri yok.",
    unknownValueSuggestion:
      "{column} için “{value}” değeri yok. {suggestion} mı demek istediniz?",
    notANumber: "“{value}” bir sayı değil.",
    badDate: "“{value}” bir tarih değil.",
    ambiguousNoYear: "“{value}” için yıl gerekir, örneğin 2015-06-30.",
    ambiguousTwoDigitYear:
      "Yılı tam yazın: “{value}” birden fazla yüzyıla denk gelebilir.",
    ambiguousMonth:
      "“{value}” birden fazla ay olabilir: adın daha fazlasını yazın.",
    backwardsRange:
      "Bu aralık bitişinden sonra başlıyor: {from}, {to} tarihinden sonra.",
    unsupportedOr:
      "OR desteklenmez. Satırlar her koşulla eşleşmelidir. Bir sütunun birkaç değerinden birini bulmak için değerleri virgülle ayırarak yazın: {example}",
    unsupportedOrNoList:
      "OR desteklenmez. Satırlar her koşulla eşleşmelidir, bu yüzden her seferinde tek bir şey arayın.",
    unsupportedMinus:
      "Hariç tutma desteklenmez, bu yüzden bu koşul yok sayılır. Metnin kendisini aramak için tırnak içine alın. Satırları daraltmak için bunun yerine kalacak değerlere göre filtreleyin: {example}",
    unsupportedMinusNoFilter:
      "Hariç tutma desteklenmez, bu yüzden bu koşul yok sayılır. Metnin kendisini aramak için tırnak içine alın.",
    exclusiveComparison: "Tarih ve saatle >= veya <= kullanın.",
    notComparable:
      "{column} için sıralama yok: bunun yerine değerlerini seçin.",
    multipleBoolean: "{column} evet ya da hayırdır, ikisi birden değil.",
    multipleDates:
      "{column} bir tarih ya da bir aralık alır, örneğin 2015..2016.",
    duplicateNoMatch:
      "Hiçbir satır {column} için iki koşulu birden karşılayamaz.",
    duplicateNotCombinable:
      "{column} aramada daha önce filtreleniyor: ikisini tek bir koşulda yazın.",
  },
})
