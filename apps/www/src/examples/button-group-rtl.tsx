// Synced from shadcn/ui (apps/v4/examples/aria/button-group-rtl.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { ArchiveIcon, ArrowLeftIcon, CalendarAddOnIcon, DeleteIcon, FilterListIcon, LabelIcon, MarkEmailReadIcon, MoreHorizIcon, ScheduleIcon } from "@tecton/react/icons"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      archive: "Archive",
      report: "Report",
      snooze: "Snooze",
      markAsRead: "Mark as Read",
      addToCalendar: "Add to Calendar",
      addToList: "Add to List",
      labelAs: "Label As...",
      personal: "Personal",
      work: "Work",
      other: "Other",
      trash: "Trash",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      archive: "أرشفة",
      report: "تقرير",
      snooze: "تأجيل",
      markAsRead: "وضع علامة كمقروء",
      addToCalendar: "إضافة إلى التقويم",
      addToList: "إضافة إلى القائمة",
      labelAs: "تصنيف كـ...",
      personal: "شخصي",
      work: "عمل",
      other: "آخر",
      trash: "سلة المهملات",
    },
  },
  he: {
    dir: "rtl",
    values: {
      archive: "ארכיון",
      report: "דוח",
      snooze: "דחה",
      markAsRead: "סמן כנקרא",
      addToCalendar: "הוסף ליומן",
      addToList: "הוסף לרשימה",
      labelAs: "תייג כ...",
      personal: "אישי",
      work: "עבודה",
      other: "אחר",
      trash: "פח",
    },
  },
}

export function ButtonGroupRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")
  const [label, setLabel] = React.useState("personal")

  return (
    <div dir={dir}>
      <ButtonGroup>
        <ButtonGroup className="hidden sm:flex">
          <Button variant="outline" size="icon" aria-label="Go Back">
            <ArrowLeftIcon className="rtl:rotate-180" />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">{t.archive}</Button>
          <Button variant="outline">{t.report}</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline">{t.snooze}</Button>
          <DropdownMenuTrigger>
            <Button variant="outline" size="icon" aria-label="More Options">
              <MoreHorizIcon />
            </Button>
            <DropdownMenu
              placement={dir === "rtl" ? "bottom start" : "bottom end"}
              data-lang={dir === "rtl" ? language : undefined}
              dir={dir}
              className="w-40"
            >
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <MarkEmailReadIcon />
                  {t.markAsRead}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArchiveIcon />
                  {t.archive}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <ScheduleIcon />
                  {t.snooze}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CalendarAddOnIcon />
                  {t.addToCalendar}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FilterListIcon />
                  {t.addToList}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <LabelIcon />
                    {t.labelAs}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    dir={dir}
                    data-lang={dir === "rtl" ? language : undefined}
                    selectionMode="single"
                    selectedKeys={[label]}
                    onSelectionChange={(keys) =>
                      setLabel([...keys][0] as string)
                    }
                  >
                    <DropdownMenuItem id="personal">
                      {t.personal}
                    </DropdownMenuItem>
                    <DropdownMenuItem id="work">{t.work}</DropdownMenuItem>
                    <DropdownMenuItem id="other">{t.other}</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive">
                  <DeleteIcon />
                  {t.trash}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </ButtonGroup>
      </ButtonGroup>
    </div>
  )
}
