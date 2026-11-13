"use client"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldSlider,
  NumberFieldUnit,
} from "@tecton/react/number-field"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      depth: "Measured depth",
      feet: "ft",
      opacity: "Opacity",
      azimuth: "Azimuth",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      depth: "العمق المقاس",
      feet: "قدم",
      opacity: "العتامة",
      azimuth: "السمت",
    },
  },
  he: {
    dir: "rtl",
    values: {
      depth: "עומק נמדד",
      feet: "רגל",
      opacity: "אטימות",
      azimuth: "אזימוט",
    },
  },
}

export default function NumberFieldRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div dir={dir} className="flex max-w-64 flex-col gap-4 text-sm">
      <NumberField defaultValue={8500} min={0} step={10} largeStep={100}>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label={t.depth} />
          <NumberFieldUnit>{t.feet}</NumberFieldUnit>
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
        <NumberField
          defaultValue={0.8}
          min={0}
          max={1}
          step={0.01}
          className="contents"
        >
          <span className="text-muted-foreground">{t.opacity}</span>
          <NumberFieldSlider>
            <NumberFieldInput aria-label={t.opacity} />
          </NumberFieldSlider>
        </NumberField>
        <NumberField defaultValue={45} min={0} max={360} className="contents">
          <span className="text-muted-foreground">{t.azimuth}</span>
          <NumberFieldSlider>
            <NumberFieldInput aria-label={t.azimuth} />
            <NumberFieldUnit>°</NumberFieldUnit>
          </NumberFieldSlider>
        </NumberField>
      </div>
    </div>
  )
}
