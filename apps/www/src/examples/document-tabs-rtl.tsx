"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { WellIcon } from "@tecton/react/icons/well"
import {
  DocumentTabs,
  DocumentTabsAdd,
  DocumentTabsClose,
  DocumentTabsContent,
  DocumentTabsLabel,
  DocumentTabsList,
  DocumentTabsTrigger,
} from "@tecton/react/tecton/document-tabs"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      list: "Open wells",
      well: "Well",
      add: "New tab",
      close: "Close",
      rename: "Rename",
      closeOthers: "Close other tabs",
      more: "More tabs",
      panel: "Production summary for",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      list: "الآبار المفتوحة",
      well: "بئر",
      add: "علامة تبويب جديدة",
      close: "إغلاق",
      rename: "إعادة تسمية",
      closeOthers: "إغلاق علامات التبويب الأخرى",
      more: "المزيد من علامات التبويب",
      panel: "ملخص الإنتاج لـ",
    },
  },
  he: {
    dir: "rtl",
    values: {
      list: "בארות פתוחות",
      well: "באר",
      add: "כרטיסייה חדשה",
      close: "סגירה",
      rename: "שינוי שם",
      closeOthers: "סגירת כרטיסיות אחרות",
      more: "כרטיסיות נוספות",
      panel: "סיכום הפקה עבור",
    },
  },
}

export default function DocumentTabsRtl() {
  const { dir, t } = useTranslation(translations, "ar")
  const [wells, setWells] = React.useState<
    Array<{ id: string; name?: string }>
  >([{ id: "1" }, { id: "2" }, { id: "3" }])
  const [active, setActive] = React.useState("1")

  return (
    <DocumentTabs
      dir={dir}
      value={active}
      onValueChange={setActive}
      onClose={(ids) =>
        setWells((all) => all.filter((well) => !ids.includes(well.id)))
      }
      onRename={(id, name) =>
        setWells((all) =>
          all.map((well) => (well.id === id ? { ...well, name } : well))
        )
      }
      messages={{
        add: t.add,
        close: t.close,
        rename: t.rename,
        closeOthers: t.closeOthers,
        more: t.more,
      }}
      className="w-full overflow-hidden rounded-md border"
    >
      <DocumentTabsList aria-label={t.list}>
        {wells.map((well) => (
          <DocumentTabsTrigger key={well.id} value={well.id}>
            <WellIcon />
            <DocumentTabsLabel>
              {well.name ?? `${t.well} ${well.id}`}
            </DocumentTabsLabel>
            <DocumentTabsClose />
          </DocumentTabsTrigger>
        ))}
        <DocumentTabsAdd
          onClick={() => {
            const id = String(
              Math.max(0, ...wells.map((well) => Number(well.id))) + 1
            )
            setWells((all) => [...all, { id }])
            setActive(id)
          }}
        />
      </DocumentTabsList>
      {wells.map((well) => (
        <DocumentTabsContent
          key={well.id}
          value={well.id}
          className="p-6 text-muted-foreground"
        >
          {t.panel} {well.name ?? `${t.well} ${well.id}`}
        </DocumentTabsContent>
      ))}
    </DocumentTabs>
  )
}
