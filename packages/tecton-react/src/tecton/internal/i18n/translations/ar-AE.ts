/**
 * ar-AE translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} المحدد",
    deselectedItem: "{item} غير المحدد",
    selectedCount: {
      "=0": "لم يتم تحديد عناصر.",
      one: "{count} عنصر محدد.",
      other: "{count} عنصر محدد.",
    },
    selectedAll: "جميع العناصر المحددة.",
  },
  chip: {
    removeButtonLabel: "إزالة",
    removeDescription: "اضغط على مفتاح DELETE لإزالة علامة.",
  },
  tree: {
    expand: "تمديد",
    collapse: "طي",
  },
  dragAndDrop: {
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
})
