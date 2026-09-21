// Synced from shadcn/ui (apps/v4/examples/aria/toggle-rtl.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { BookmarkIcon } from "@tecton/react/icons"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Toggle } from "@tecton/react/components/toggle"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      label: "Bookmark",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      label: "إشارة مرجعية",
    },
  },
  he: {
    dir: "rtl",
    values: {
      label: "סימנייה",
    },
  },
}

export function ToggleRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <Toggle aria-label="Toggle bookmark" size="sm" variant="outline" dir={dir}>
      <BookmarkIcon className="group-aria-pressed/toggle:fill-foreground" />
      {t.label}
    </Toggle>
  )
}
