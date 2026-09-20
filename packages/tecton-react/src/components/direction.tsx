"use client"

import * as React from "react"
import { I18nProvider, useLocale } from "react-aria-components"

function DirectionProvider(
  props: React.ComponentProps<typeof I18nProvider> & {
    direction?: "ltr" | "rtl"
  }
) {
  // For compatibility with Radix / Base UI, if only a `direction` is provided and not a `locale`,
  // create a locale string that forces the direction by setting the script to arabic or latin.
  const { locale: currentLocale } = useLocale()
  let locale = props.locale
  if (!locale && props.direction) {
    locale = new Intl.Locale(currentLocale, {
      script: props.direction === "rtl" ? "Arab" : "Latn",
    }).toString()
  }

  return <I18nProvider {...props} locale={locale} />
}

// The return type is spelled out on purpose: inferring it names React Aria's
// `Direction`, which lives in @react-types/shared and is not exported from
// react-aria-components, so declaration emit fails with TS2883.
function useDirection(): "ltr" | "rtl" {
  const { direction } = useLocale()
  return direction
}

export { DirectionProvider, I18nProvider, useDirection, useLocale }
