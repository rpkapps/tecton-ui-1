/**
 * Internal to `@tecton/react`: localized strings, one entry per locale.
 *
 * Copied from React Aria (`react-aria` 3.52, `intl/dnd`), © Adobe,
 * Apache License 2.0 (https://www.apache.org/licenses/LICENSE-2.0), with
 * ICU placeholders written as `{name}` and plurals as category maps (see
 * `useMessages`). A locale missing here falls back to its language, then
 * to `en-US`.
 */
import type { MessageTable } from "../messages"

type Keys =
  | "dragItem"
  | "dragStartedKeyboard"
  | "dragStartedVirtual"
  | "dropCanceled"
  | "dropComplete"
  | "dropOnItem"
  | "insertBefore"
  | "insertBetween"
  | "insertAfter"

const DRAG_MESSAGES: MessageTable<Keys> = {
  "ar-AE": {
    dragItem: "اسحب {itemText}",
    dragStartedKeyboard:
      "بدأ السحب. اضغط Tab للانتقال إلى موضع الإفلات، ثم اضغط Enter للإفلات، أو اضغط Escape للإلغاء.",
    dragStartedVirtual:
      "بدأ السحب. انتقل إلى مكان الإفلات، ثم انقر أو اضغط Enter للإفلات.",
    dropCanceled: "تم إلغاء الإفلات.",
    dropComplete: "اكتمل الإفلات.",
    dropOnItem: "إفلات {itemText}",
    insertBefore: "أدخل قبل {itemText}",
    insertBetween: "أدخل بين {beforeItemText} و {afterItemText}",
    insertAfter: "أدخل بعد {itemText}",
  },
  "bg-BG": {
    dragItem: "Плъзни {itemText}",
    dragStartedKeyboard:
      "Започна плъзгане. Натиснете „Tab“, за да се придвижите до целта, след което натиснете „Enter“ за пускане или натиснете „Escape“ за отмяна.",
    dragStartedVirtual:
      "Започна плъзгане. Придвижете се до целта, след което щракнете или натиснете „Enter“ за пускане.",
    dropCanceled: "Пускането е отменено.",
    dropComplete: "Пускането е завършено.",
    dropOnItem: "Пусни върху {itemText}",
    insertBefore: "Вмъкни преди {itemText}",
    insertBetween: "Вмъкни между {beforeItemText} и {afterItemText}",
    insertAfter: "Вмъкни след {itemText}",
  },
  "cs-CZ": {
    dragItem: "Přetáhnout {itemText}",
    dragStartedKeyboard:
      "Začněte s přetahováním. Po stisknutí klávesy Tab najděte požadovaný cíl a stisknutím klávesy Enter přetažení dokončete nebo stisknutím klávesy Esc akci zrušte.",
    dragStartedVirtual:
      "Začněte s přetahováním. Najděte požadovaný cíl a kliknutím nebo stisknutím klávesy Enter přetažení dokončete.",
    dropCanceled: "Přetažení bylo zrušeno.",
    dropComplete: "Přetažení bylo dokončeno.",
    dropOnItem: "Přetáhnout na {itemText}",
    insertBefore: "Vložit před {itemText}",
    insertBetween: "Vložit mezi {beforeItemText} a {afterItemText}",
    insertAfter: "Vložit za {itemText}",
  },
  "da-DK": {
    dragItem: "Træk {itemText}",
    dragStartedKeyboard:
      "Startet med at trække. Tryk på Tab for at gå til et slip-mål, tryk derefter på Enter for at slippe, eller tryk på Escape for at annullere.",
    dragStartedVirtual:
      "Startet med at trække. Gå til et slip-mål, og klik eller tryk derefter på enter for at slippe.",
    dropCanceled: "Slip annulleret.",
    dropComplete: "Slip fuldført.",
    dropOnItem: "Slip på {itemText}",
    insertBefore: "Indsæt før {itemText}",
    insertBetween: "Indsæt mellem {beforeItemText} og {afterItemText}",
    insertAfter: "Indsæt efter {itemText}",
  },
  "de-DE": {
    dragItem: "{itemText} ziehen",
    dragStartedKeyboard:
      "Ziehvorgang gestartet. Drücken Sie die Tabulatortaste, um zu einem Ablegeziel zu navigieren und drücken Sie dann die Eingabetaste, um das Objekt abzulegen, oder Escape, um den Vorgang abzubrechen.",
    dragStartedVirtual:
      "Ziehvorgang gestartet. Navigieren Sie zu einem Ablegeziel und klicken Sie oder drücken Sie die Eingabetaste, um das Objekt abzulegen.",
    dropCanceled: "Ablegen abgebrochen.",
    dropComplete: "Ablegen abgeschlossen.",
    dropOnItem: "Auf {itemText} ablegen",
    insertBefore: "Vor {itemText} einfügen",
    insertBetween: "Zwischen {beforeItemText} und {afterItemText} einfügen",
    insertAfter: "Nach {itemText} einfügen",
  },
  "el-GR": {
    dragItem: "Μεταφορά {itemText}",
    dragStartedKeyboard:
      "Η μεταφορά ξεκίνησε. Πατήστε το πλήκτρο Tab για να μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, πατήστε Enter για απόθεση ή πατήστε Escape για ακύρωση.",
    dragStartedVirtual:
      "Η μεταφορά ξεκίνησε. Μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, κάντε κλικ ή πατήστε Enter για απόθεση.",
    dropCanceled: "Η απόθεση ακυρώθηκε.",
    dropComplete: "Η απόθεση ολοκληρώθηκε.",
    dropOnItem: "Απόθεση σε {itemText}",
    insertBefore: "Εισαγωγή πριν από {itemText}",
    insertBetween: "Εισαγωγή μεταξύ {beforeItemText} και {afterItemText}",
    insertAfter: "Εισαγωγή μετά από {itemText}",
  },
  "en-US": {
    dragItem: "Drag {itemText}",
    dragStartedKeyboard:
      "Started dragging. Press Tab to navigate to a drop target, then press Enter to drop, or press Escape to cancel.",
    dragStartedVirtual:
      "Started dragging. Navigate to a drop target, then click or press Enter to drop.",
    dropCanceled: "Drop canceled.",
    dropComplete: "Drop complete.",
    dropOnItem: "Drop on {itemText}",
    insertBefore: "Insert before {itemText}",
    insertBetween: "Insert between {beforeItemText} and {afterItemText}",
    insertAfter: "Insert after {itemText}",
  },
  "es-ES": {
    dragItem: "Arrastrar {itemText}",
    dragStartedKeyboard:
      "Se ha empezado a arrastrar. Pulse el tabulador para ir al destino donde se vaya a colocar y, a continuación, pulse Intro para soltar, o pulse Escape para cancelar.",
    dragStartedVirtual:
      "Se ha empezado a arrastrar. Vaya al destino donde se vaya a colocar y, a continuación, haga clic o pulse Intro para soltar.",
    dropCanceled: "Se ha cancelado la colocación.",
    dropComplete: "Colocación finalizada.",
    dropOnItem: "Soltar en {itemText}",
    insertBefore: "Insertar antes de {itemText}",
    insertBetween: "Insertar entre {beforeItemText} y {afterItemText}",
    insertAfter: "Insertar después de {itemText}",
  },
  "et-EE": {
    dragItem: "Lohista {itemText}",
    dragStartedKeyboard:
      "Alustati lohistamist. Kukutamise sihtmärgi juurde navigeerimiseks vajutage klahvi Tab, seejärel vajutage kukutamiseks klahvi Enter või loobumiseks klahvi Escape.",
    dragStartedVirtual:
      "Alustati lohistamist. Navigeerige kukutamise sihtmärgi juurde ja kukutamiseks klõpsake või vajutage klahvi Enter.",
    dropCanceled: "Lohistamisest loobuti.",
    dropComplete: "Lohistamine on tehtud.",
    dropOnItem: "Kukuta asukohta {itemText}",
    insertBefore: "Sisesta {itemText} ette",
    insertBetween: "Sisesta {beforeItemText} ja {afterItemText} vahele",
    insertAfter: "Sisesta {itemText} järele",
  },
  "fi-FI": {
    dragItem: "Vedä kohdetta {itemText}",
    dragStartedKeyboard:
      "Vetäminen aloitettu. Siirry pudotuskohteeseen painamalla sarkainnäppäintä ja sitten pudota painamalla Enter-näppäintä tai peruuta painamalla Escape-näppäintä.",
    dragStartedVirtual:
      "Vetäminen aloitettu. Siirry pudotuskohteeseen ja pudota napsauttamalla tai painamalla Enter-näppäintä.",
    dropCanceled: "Pudotus peruutettu.",
    dropComplete: "Pudotus suoritettu.",
    dropOnItem: "Pudota kohteeseen {itemText}",
    insertBefore: "Lisää ennen kohdetta {itemText}",
    insertBetween: "Lisää kohteiden {beforeItemText} ja {afterItemText} väliin",
    insertAfter: "Lisää kohteen {itemText} jälkeen",
  },
  "fr-FR": {
    dragItem: "Déplacer {itemText}",
    dragStartedKeyboard:
      "Déplacement commencé. Appuyez sur Tabulation pour accéder à une cible de dépôt, puis appuyez sur Entrée pour déposer, ou appuyez sur Échap pour annuler.",
    dragStartedVirtual:
      "Déplacement commencé. Accédez à une cible de dépôt, puis cliquez ou appuyez sur Entrée pour déposer.",
    dropCanceled: "Dépôt annulé.",
    dropComplete: "Dépôt terminé.",
    dropOnItem: "Déposer sur {itemText}",
    insertBefore: "Insérer avant {itemText}",
    insertBetween: "Insérer entre {beforeItemText} et {afterItemText}",
    insertAfter: "Insérer après {itemText}",
  },
  "he-IL": {
    dragItem: "גרור את {itemText}",
    dragStartedKeyboard:
      "התחלת לגרור. הקש על Tab כדי לנווט לנקודת הגרירה ולאחר מכן הקש על Enter כדי לשחרר או על Escape כדי לבטל.",
    dragStartedVirtual:
      "התחלת לגרור. נווט לנקודת השחרור ולאחר מכן לחץ או הקש על Enter כדי לשחרר.",
    dropCanceled: "השחרור בוטל.",
    dropComplete: "השחרור הושלם.",
    dropOnItem: "שחרר על {itemText}",
    insertBefore: "הוסף לפני {itemText}",
    insertBetween: "הוסף בין {beforeItemText} לבין {afterItemText}",
    insertAfter: "הוסף אחרי {itemText}",
  },
  "hr-HR": {
    dragItem: "Povucite stavku {itemText}",
    dragStartedKeyboard:
      "Počeli ste povlačiti. Pritisnite tipku tabulatora da biste došli do cilja ispuštanja, a zatim Enter da biste ispustili stavku ili Escape da biste prekinuli povlačenje.",
    dragStartedVirtual:
      "Počeli ste povlačiti. Dođite do cilja ispuštanja, a zatim kliknite ili pritisnite Enter da biste ispustili stavku.",
    dropCanceled: "Povlačenje je prekinuto.",
    dropComplete: "Ispuštanje je dovršeno.",
    dropOnItem: "Ispustite na stavku {itemText}",
    insertBefore: "Ispustite ispred stavke {itemText}",
    insertBetween: "Umetnite između stavki {beforeItemText} i {afterItemText}",
    insertAfter: "Umetnite iza stavke {itemText}",
  },
  "hu-HU": {
    dragItem: "{itemText} húzása",
    dragStartedKeyboard:
      "Húzás megkezdve. Nyomja le a Tab billentyűt az elengedési célhoz navigálásához, majd nyomja le az Enter billentyűt az elengedéshez, vagy nyomja le az Escape billentyűt a megszakításhoz.",
    dragStartedVirtual:
      "Húzás megkezdve. Navigáljon egy elengedési célhoz, majd kattintson vagy nyomja le az Enter billentyűt az elengedéshez.",
    dropCanceled: "Elengedés megszakítva.",
    dropComplete: "Elengedés teljesítve.",
    dropOnItem: "Elengedés erre: {itemText}",
    insertBefore: "Beszúrás {itemText} elé",
    insertBetween: "Beszúrás {beforeItemText} és {afterItemText} közé",
    insertAfter: "Beszúrás {itemText} után",
  },
  "it-IT": {
    dragItem: "Trascina {itemText}",
    dragStartedKeyboard:
      "Hai iniziato a trascinare. Premi Tab per arrivare sull’area di destinazione, quindi premi Invio per rilasciare o Esc per annullare.",
    dragStartedVirtual:
      "Hai iniziato a trascinare. Arriva sull’area di destinazione, quindi fai clic o premi Invio per rilasciare.",
    dropCanceled: "Rilascio annullato.",
    dropComplete: "Rilascio completato.",
    dropOnItem: "Rilascia su {itemText}",
    insertBefore: "Inserisci prima di {itemText}",
    insertBetween: "Inserisci tra {beforeItemText} e {afterItemText}",
    insertAfter: "Inserisci dopo {itemText}",
  },
  "ja-JP": {
    dragItem: "{itemText} をドラッグ",
    dragStartedKeyboard:
      "ドラッグを開始します。Tab キーを押してドロップターゲットにいどうし、Enter キーを押してドロップするか、Esc キーを押してキャンセルします。",
    dragStartedVirtual:
      "ドラッグを開始しました。ドロップのターゲットに移動し、クリックまたは Enter キーを押してドロップします。",
    dropCanceled: "ドロップがキャンセルされました。",
    dropComplete: "ドロップが完了しました。",
    dropOnItem: "{itemText} にドロップ",
    insertBefore: "{itemText} の前に挿入",
    insertBetween: "{beforeItemText} と {afterItemText} の間に挿入",
    insertAfter: "{itemText} の後に挿入",
  },
  "ko-KR": {
    dragItem: "{itemText} 드래그",
    dragStartedKeyboard:
      "드래그가 시작되었습니다. Tab을 눌러 드롭 대상으로 이동한 다음 Enter를 눌러 드롭하거나 Esc를 눌러 취소하세요.",
    dragStartedVirtual:
      "드래그가 시작되었습니다. 드롭 대상으로 이동한 다음 클릭하거나 Enter를 눌러 드롭하세요.",
    dropCanceled: "드롭이 취소되었습니다.",
    dropComplete: "드롭이 완료되었습니다.",
    dropOnItem: "{itemText}에 드롭",
    insertBefore: "{itemText} 이전에 삽입",
    insertBetween: "{beforeItemText} 및 {afterItemText} 사이에 삽입",
    insertAfter: "{itemText} 이후에 삽입",
  },
  "lt-LT": {
    dragItem: "Vilkti {itemText}",
    dragStartedKeyboard:
      "Pradėta vilkti. Paspauskite „Tab“, kad pereitumėte į tiesioginę paskirties vietą, tada paspauskite „Enter“, kad numestumėte, arba „Escape“, kad atšauktumėte.",
    dragStartedVirtual:
      "Pradėta vilkti. Eikite į tiesioginę paskirties vietą ir spustelėkite arba paspauskite „Enter“, kad numestumėte.",
    dropCanceled: "Numetimas atšauktas.",
    dropComplete: "Numesta.",
    dropOnItem: "Numesti ant {itemText}",
    insertBefore: "Įterpti prieš {itemText}",
    insertBetween: "Įterpti tarp {beforeItemText} ir {afterItemText}",
    insertAfter: "Įterpti po {itemText}",
  },
  "lv-LV": {
    dragItem: "Velciet {itemText}",
    dragStartedKeyboard:
      "Uzsākta vilkšana. Nospiediet taustiņu Tab, lai pārietu uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu, vai nospiediet Escape, lai atceltu.",
    dragStartedVirtual:
      "Uzsākta vilkšana. Pārejiet uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu.",
    dropCanceled: "Nomešana atcelta.",
    dropComplete: "Nomešana pabeigta.",
    dropOnItem: "Nometiet uz {itemText}",
    insertBefore: "Ievietojiet pirms {itemText}",
    insertBetween: "Ievietojiet starp {beforeItemText} un {afterItemText}",
    insertAfter: "Ievietojiet pēc {itemText}",
  },
  "nb-NO": {
    dragItem: "Dra {itemText}",
    dragStartedKeyboard:
      "Begynte å dra. Trykk på Tab for å navigere til et mål, og trykk deretter på Enter for å slippe eller på Esc for å avbryte.",
    dragStartedVirtual:
      "Begynte å dra. Naviger til et mål, og klikk eller trykk på Enter for å slippe.",
    dropCanceled: "Avbrøt slipping.",
    dropComplete: "Slippingen er fullført.",
    dropOnItem: "Slipp på {itemText}",
    insertBefore: "Sett inn før {itemText}",
    insertBetween: "Sett inn mellom {beforeItemText} og {afterItemText}",
    insertAfter: "Sett inn etter {itemText}",
  },
  "nl-NL": {
    dragItem: "{itemText} slepen",
    dragStartedKeyboard:
      "Begonnen met slepen. Druk op Tab om naar een locatie te gaan. Druk dan op Enter om neer te zetten, of op Esc om te annuleren.",
    dragStartedVirtual:
      "Begonnen met slepen. Ga naar de gewenste locatie en klik of druk op Enter om neer te zetten.",
    dropCanceled: "Neerzetten geannuleerd.",
    dropComplete: "Neerzetten voltooid.",
    dropOnItem: "Neerzetten op {itemText}",
    insertBefore: "Plaatsen vóór {itemText}",
    insertBetween: "Plaatsen tussen {beforeItemText} en {afterItemText}",
    insertAfter: "Plaatsen na {itemText}",
  },
  "pl-PL": {
    dragItem: "Przeciągnij {itemText}",
    dragStartedKeyboard:
      "Rozpoczęto przeciąganie. Naciśnij Tab, aby wybrać miejsce docelowe, a następnie naciśnij Enter, aby upuścić, lub Escape, aby anulować.",
    dragStartedVirtual:
      "Rozpoczęto przeciąganie. Wybierz miejsce, w którym chcesz upuścić element, a następnie kliknij lub naciśnij Enter, aby upuścić.",
    dropCanceled: "Anulowano upuszczenie.",
    dropComplete: "Zakończono upuszczanie.",
    dropOnItem: "Upuść na {itemText}",
    insertBefore: "Umieść przed {itemText}",
    insertBetween: "Umieść między {beforeItemText} i {afterItemText}",
    insertAfter: "Umieść za {itemText}",
  },
  "pt-BR": {
    dragItem: "Arrastar {itemText}",
    dragStartedKeyboard:
      "Comece a arrastar. Pressione Tab para navegar até um alvo e, em seguida, pressione Enter para soltar ou pressione Escape para cancelar.",
    dragStartedVirtual:
      "Comece a arrastar. Navegue até um alvo e clique ou pressione Enter para soltar.",
    dropCanceled: "Liberação cancelada.",
    dropComplete: "Liberação concluída.",
    dropOnItem: "Soltar em {itemText}",
    insertBefore: "Inserir antes de {itemText}",
    insertBetween: "Inserir entre {beforeItemText} e {afterItemText}",
    insertAfter: "Inserir após {itemText}",
  },
  "pt-PT": {
    dragItem: "Arrastar {itemText}",
    dragStartedKeyboard:
      "Arrasto iniciado. Prima a tecla de tabulação para navegar para um destino para largar, e em seguida prima Enter para largar ou prima Escape para cancelar.",
    dragStartedVirtual:
      "Arrasto iniciado. Navegue para um destino para largar, e em seguida clique ou prima Enter para largar.",
    dropCanceled: "Largar cancelado.",
    dropComplete: "Largar completo.",
    dropOnItem: "Largar em {itemText}",
    insertBefore: "Inserir antes de {itemText}",
    insertBetween: "Inserir entre {beforeItemText} e {afterItemText}",
    insertAfter: "Inserir depois de {itemText}",
  },
  "ro-RO": {
    dragItem: "Glisați {itemText}",
    dragStartedKeyboard:
      "A început glisarea. Apăsați pe Tab pentru a naviga la o țintă de fixare, apoi apăsați pe Enter pentru a fixa sau apăsați pe Escape pentru a anula glisarea.",
    dragStartedVirtual:
      "A început glisarea. Navigați la o țintă de fixare, apoi faceți clic sau apăsați pe Enter pentru a fixa.",
    dropCanceled: "Fixare anulată.",
    dropComplete: "Fixare finalizată.",
    dropOnItem: "Fixați pe {itemText}",
    insertBefore: "Inserați înainte de {itemText}",
    insertBetween: "Inserați între {beforeItemText} și {afterItemText}",
    insertAfter: "Inserați după {itemText}",
  },
  "ru-RU": {
    dragItem: "Перетащить {itemText}",
    dragStartedKeyboard:
      "Начато перетаскивание. Нажмите клавишу Tab для выбора цели, затем нажмите клавишу Enter, чтобы применить перетаскивание, или клавишу Escape для отмены действия.",
    dragStartedVirtual:
      "Начато перетаскивание. Нажмите клавишу Tab для выбора цели, затем нажмите клавишу Enter, чтобы применить перетаскивание.",
    dropCanceled: "Перетаскивание отменено.",
    dropComplete: "Перетаскивание завершено.",
    dropOnItem: "Перетащить на {itemText}",
    insertBefore: "Вставить перед {itemText}",
    insertBetween: "Вставить между {beforeItemText} и {afterItemText}",
    insertAfter: "Вставить после {itemText}",
  },
  "sk-SK": {
    dragItem: "Presunúť položku {itemText}",
    dragStartedKeyboard:
      "Presúvanie sa začalo. Do cieľového umiestnenia prejdete stlačením klávesu Tab. Ak chcete položku umiestniť, stlačte kláves Enter alebo stlačte kláves Esc, ak chcete presúvanie zrušiť.",
    dragStartedVirtual:
      "Presúvanie sa začalo. Prejdite na cieľové umiestnenie a kliknutím alebo stlačením klávesu Enter umiestnite položku.",
    dropCanceled: "Umiestnenie zrušené.",
    dropComplete: "Umiestnenie dokončené.",
    dropOnItem: "Umiestniť na položku {itemText}",
    insertBefore: "Vložiť pred položku {itemText}",
    insertBetween: "Vložiť medzi položky {beforeItemText} a {afterItemText}",
    insertAfter: "Vložiť za položku {itemText}",
  },
  "sl-SI": {
    dragItem: "Povleci {itemText}",
    dragStartedKeyboard:
      "Vlečenje se je začelo. Pritisnite tipko Tab za pomik na mesto, kamor želite spustiti elemente, in pritisnite tipko Enter, da jih spustite, ali tipko Escape, da prekličete postopek.",
    dragStartedVirtual:
      "Vlečenje se je začelo. Pomaknite se na mesto, kamor želite spustiti elemente, in kliknite ali pritisnite tipko Enter, da jih spustite.",
    dropCanceled: "Spust je preklican.",
    dropComplete: "Spust je končan.",
    dropOnItem: "Spusti na mesto {itemText}",
    insertBefore: "Vstavi pred {itemText}",
    insertBetween: "Vstavi med {beforeItemText} in {afterItemText}",
    insertAfter: "Vstavi za {itemText}",
  },
  "sr-SP": {
    dragItem: "Prevucite {itemText}",
    dragStartedKeyboard:
      "Prevlačenje je započeto. Pritisnite Tab da biste otišli do cilja za otpuštanje, zatim pritisnite Enter za ispuštanje ili pritisnite Escape za otkazivanje.",
    dragStartedVirtual:
      "Prevlačenje je započeto. Idite do cilja za otpuštanje, a zatim kliknite ili pritinite Enter za otpuštanje.",
    dropCanceled: "Otpuštanje je otkazano.",
    dropComplete: "Prevlačenje je završeno.",
    dropOnItem: "Otpusti na {itemText}",
    insertBefore: "Umetnite ispred {itemText}",
    insertBetween: "Umetnite između {beforeItemText} i {afterItemText}",
    insertAfter: "Umetnite posle {itemText}",
  },
  "sv-SE": {
    dragItem: "Dra {itemText}",
    dragStartedKeyboard:
      "Börja dra. Tryck på tabb för att navigera till målet, tryck på enter för att släppa eller på escape för att avbryta.",
    dragStartedVirtual:
      "Börja dra. Navigera till ett mål och klicka eller tryck på enter för att släppa.",
    dropCanceled: "Släppåtgärd avbröts.",
    dropComplete: "Släppåtgärd klar.",
    dropOnItem: "Släpp på {itemText}",
    insertBefore: "Infoga före {itemText}",
    insertBetween: "Infoga mellan {beforeItemText} och {afterItemText}",
    insertAfter: "Infoga efter {itemText}",
  },
  "tr-TR": {
    dragItem: "{itemText}’i sürükle",
    dragStartedKeyboard:
      "Sürükleme başlatıldı. Bir bırakma hedefine gitmek için Tab’a basın, ardından bırakmak için Enter’a basın veya iptal etmek için Escape’e basın.",
    dragStartedVirtual:
      "Sürükleme başlatıldı. Bir bırakma hedefine gidin, ardından bırakmak için Enter’a tıklayın veya basın.",
    dropCanceled: "Bırakma iptal edildi.",
    dropComplete: "Bırakma tamamlandı.",
    dropOnItem: "{itemText} üzerine bırak",
    insertBefore: "{itemText}’den önce gir",
    insertBetween: "{beforeItemText} ve {afterItemText} arasına gir",
    insertAfter: "{itemText}’den sonra gir",
  },
  "uk-UA": {
    dragItem: "Перетягнути {itemText}",
    dragStartedKeyboard:
      "Перетягування почалося. Натисніть Tab, щоб перейти до цілі перетягування, потім натисніть Enter, щоб перетягнути, або Escape, щоб скасувати.",
    dragStartedVirtual:
      "Перетягування почалося. Перейдіть до цілі перетягування, потім натисніть Enter, щоб перетягнути.",
    dropCanceled: "Перетягування скасовано.",
    dropComplete: "Перетягування завершено.",
    dropOnItem: "Перетягнути на {itemText}",
    insertBefore: "Вставити перед {itemText}",
    insertBetween: "Вставити між {beforeItemText} і {afterItemText}",
    insertAfter: "Вставити після {itemText}",
  },
  "zh-CN": {
    dragItem: "拖动 {itemText}",
    dragStartedKeyboard:
      "已开始拖动。按 Tab 导航到放置目标，然后按 Enter 放置或按 Escape 取消。",
    dragStartedVirtual: "已开始拖动。导航到放置目标，然后单击或按 Enter 放置。",
    dropCanceled: "放置已取消。",
    dropComplete: "放置已完成。",
    dropOnItem: "放置于 {itemText}",
    insertBefore: "插入到 {itemText} 之前",
    insertBetween: "插入到 {beforeItemText} 和 {afterItemText} 之间",
    insertAfter: "插入到 {itemText} 之后",
  },
  "zh-TW": {
    dragItem: "拖曳「{itemText}」",
    dragStartedKeyboard:
      "已開始拖曳。按 Tab 鍵以瀏覽至放置目標，然後按 Enter 鍵以放置，或按 Escape 鍵以取消。",
    dragStartedVirtual:
      "已開始拖曳。瀏覽至放置目標，然後按一下滑鼠或按 Enter 鍵以放置。",
    dropCanceled: "放置已取消。",
    dropComplete: "放置已完成。",
    dropOnItem: "放置在「{itemText}」上",
    insertBefore: "插入至「{itemText}」之前",
    insertBetween: "插入至「{beforeItemText}」和「{afterItemText}」之間",
    insertAfter: "插入至「{itemText}」之後",
  },
}

export { DRAG_MESSAGES }
