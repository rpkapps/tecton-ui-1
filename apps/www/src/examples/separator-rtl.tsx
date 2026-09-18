// Synced from shadcn/ui (apps/v4/examples/aria/separator-rtl.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Separator } from "@tecton/react/components/separator"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      title: "Tecton UI",
      subtitle: "The Tecton design system for React",
      description:
        "Components, icons and blocks that carry the Tecton look in every application.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      title: "Tecton UI",
      subtitle: "الأساس لنظام التصميم الخاص بك",
      description:
        "مجموعة من المكونات المصممة بشكل جميل يمكنك تخصيصها وتوسيعها والبناء عليها.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      title: "Tecton UI",
      subtitle: "הבסיס למערכת העיצוב שלך",
      description:
        "סט של רכיבים מעוצבים בצורה יפה שאתה יכול להתאים אישית, להרחיב ולבנות עליהם.",
    },
  },
}

export function SeparatorRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div className="flex max-w-sm flex-col gap-4 text-sm" dir={dir}>
      <div className="flex flex-col gap-1.5">
        <div className="leading-none font-medium">{t.title}</div>
        <div className="text-muted-foreground">{t.subtitle}</div>
      </div>
      <Separator />
      <div>{t.description}</div>
    </div>
  )
}
