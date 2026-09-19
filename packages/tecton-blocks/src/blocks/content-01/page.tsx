"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { Separator } from "@tecton/react/components/separator"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderEyebrow,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

import { WellHeaderForm } from "./components/well-header-form"
import { defaultWellHeader } from "./data"
import type { WellHeader } from "./data"

/**
 * Plain content page: the shell header and a single, width-constrained
 * content column with a page header and a data-entry form. The layout
 * most applications need — no sidebar, no aside.
 */
export default function Page() {
  const [saved, setSaved] = React.useState<WellHeader>(defaultWellHeader)
  const [draft, setDraft] = React.useState<WellHeader>(defaultWellHeader)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  return (
    <div
      data-slot="content-page"
      className="min-h-svh w-full bg-background text-foreground"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderEyebrow>Orion West / OW-B</PageHeaderEyebrow>
            <PageHeaderTitle>Well header</PageHeaderTitle>
            <PageHeaderDescription>
              Register the well before starting the initial design. Fields
              marked with a lock are synchronised from the asset register.
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <Button
              variant="outline"
              isDisabled={!dirty}
              onPress={() => setDraft(saved)}
            >
              Discard
            </Button>
            <Button isDisabled={!dirty} onPress={() => setSaved(draft)}>
              Save well
            </Button>
          </PageHeaderActions>
        </PageHeader>
        <Separator emphasis="subtle" />
        <WellHeaderForm value={draft} onChange={setDraft} />
      </div>
    </div>
  )
}

export { WellHeaderForm, FormSection } from "./components/well-header-form"
export { defaultWellHeader, operators, rigs, wellTypes } from "./data"
export type { WellHeader, WellType } from "./data"
