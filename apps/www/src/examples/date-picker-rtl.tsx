// Synced from shadcn/ui (apps/v4/examples/aria/date-picker-rtl.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { getLocalTimeZone, type CalendarDate } from "@internationalized/date"
import { ChevronDownIcon } from "lucide-react"
import { I18nProvider } from "@tecton/react/components/direction"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import { Calendar } from "@tecton/react/components/calendar"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      placeholder: "Pick a date",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      placeholder: "اختر تاريخًا",
    },
  },
  he: {
    dir: "rtl",
    values: {
      placeholder: "בחר תאריך",
    },
  },
}

export function DatePickerRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")
  const [date, setDate] = React.useState<CalendarDate | null>(null)

  return (
    <PopoverTrigger>
      <Button
        variant={"outline"}
        data-empty={!date}
        className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
        dir={dir}
      >
        {date ? (
          date
            .toDate(getLocalTimeZone())
            .toLocaleDateString(language, { dateStyle: "long" })
        ) : (
          <span>{t.placeholder}</span>
        )}
        <ChevronDownIcon data-icon="inline-end" />
      </Button>
      <Popover className="w-auto p-0" placement="bottom start" dir={dir}>
        <I18nProvider locale={language}>
          <Calendar value={date} onChange={setDate} />
        </I18nProvider>
      </Popover>
    </PopoverTrigger>
  )
}
