import * as React from "react"
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TectonProvider } from "@tecton/react/provider"
import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tree-view"

import {
  createTranslator,
  defineTranslations,
  loadTranslations,
  resolveLocale,
  useTranslations,
  type Translation,
} from "../internal/i18n/translations"
import enUS from "../internal/i18n/translations/en-US"

type Table = Record<string, Record<string, Translation>>

const DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../internal/i18n/translations"
)

async function locales() {
  const files = readdirSync(DIR).filter((file) => file.endsWith(".ts"))
  return Promise.all(
    files.map(async (file) => {
      const module = (await import(path.join(DIR, file))) as { default: Table }
      return [file, module.default] as const
    })
  )
}

const placeholders = (translation: Translation) =>
  [
    ...new Set(
      (typeof translation === "string"
        ? translation
        : Object.values(translation).join(" ")
      ).match(/\{\w+\}/g) ?? []
    ),
  ].sort()

describe("translations", () => {
  it("covers 34 locales, each with en-US's keys and placeholders", async () => {
    const english = enUS as unknown as Table
    const all = await locales()
    expect(all).toHaveLength(34)
    for (const [file, table] of all) {
      for (const [namespace, keys] of Object.entries(table)) {
        for (const [key, translation] of Object.entries(keys)) {
          const source = english[namespace][key]
          expect([file, key, typeof translation]).toEqual([
            file,
            key,
            typeof source,
          ])
          if (typeof translation !== "string")
            expect(translation.other).toBeTruthy()
          expect([file, key, placeholders(translation)]).toEqual([
            file,
            key,
            placeholders(source),
          ])
        }
      }
    }
  })

  it("resolves a locale to itself, its language, or en-US", () => {
    expect(resolveLocale("de-DE")).toBe("de-DE")
    expect(resolveLocale("de-AT")).toBe("de-DE")
    expect(resolveLocale("en-GB")).toBe("en-US")
    expect(resolveLocale("xx-YY")).toBe("en-US")
  })

  it("translates with placeholders and plurals, and falls back to en-US per key", () => {
    const en = createTranslator("grid", "en-US")
    expect(en("selectedItem", { item: "Wells" })).toBe("Wells selected.")
    expect([0, 1, 3].map((count) => en("selectedCount", { count }))).toEqual([
      "No items selected.",
      "1 item selected.",
      "3 items selected.",
    ])
    const partial = createTranslator("chip", "xx-YY", {
      chip: { removeButtonLabel: "Weg" },
    })
    expect(partial("removeButtonLabel")).toBe("Weg")
    expect(partial("removeDescription")).toBe("Press Delete to remove tag.")
  })

  it("chooses the plural form of a count by the locale's rules", async () => {
    const tables = Object.fromEntries(await locales())
    const results = (locale: string, count: number) =>
      createTranslator(
        "dataTable",
        locale,
        tables[`${locale}.ts`] as never
      )("resultsCount", { count, total: count })
    expect(results("en-US", 5)).toBe("5 results")
    expect(results("de-DE", 5)).toBe("5 Ergebnisse")
    expect(results("ru-RU", 5)).toBe("5 результатов")
    expect(results("ru-RU", 3)).toBe("3 результата")
    expect(results("pl-PL", 5)).toBe("5 wyników")
    expect(results("ar-AE", 5)).toBe("5 نتائج")
  })

  it("names the pagination's arrows, page field and rows in every locale", async () => {
    const tables = Object.fromEntries(await locales())
    for (const [file, table] of Object.entries(tables)) {
      const strings = table.dataTable
      // The page picker and the page buttons are gone.
      for (const key of [
        "pagePicker",
        "pagePickerHint",
        "pagePickerGo",
        "pagePickerInvalid",
        "goToPage",
        "previous",
        "next",
      ])
        expect([file, key, strings[key]]).toEqual([file, key, undefined])
      for (const key of [
        "firstPage",
        "previousPage",
        "nextPage",
        "lastPage",
        "page",
        "pageOf",
        "rows",
        "rowsPerPage",
      ])
        expect([file, key, typeof strings[key]]).toEqual([file, key, "string"])
    }
    const de = createTranslator(
      "dataTable",
      "de-DE",
      tables["de-DE.ts"] as never
    )
    expect(de("firstPage")).toBe("Erste Seite")
    expect(de("pageOf", { page: "3", pageCount: "1.240" })).toBe(
      "Seite 3 von 1.240"
    )
  })

  it("names NumberField's minus and plus buttons in every locale", async () => {
    const tables = Object.fromEntries(await locales())
    for (const [file, table] of Object.entries(tables))
      for (const key of ["increase", "decrease"] as const)
        expect([file, key, typeof table.numberField[key]]).toEqual([
          file,
          key,
          "string",
        ])
    expect(
      createTranslator(
        "numberField",
        "fr-FR",
        tables["fr-FR.ts"] as never
      )("increase")
    ).toBe("Augmenter")
  })

  it("counts a number filter's matches in every locale", async () => {
    const tables = Object.fromEntries(await locales())
    for (const [file, table] of Object.entries(tables))
      expect([file, typeof table.dataTable.filterMatches]).toEqual([
        file,
        "object",
      ])
    const values = (count: number) => ({
      count,
      matches: String(count),
      total: "120",
    })
    const en = createTranslator("dataTable", "en-US")
    expect(en("filterMatches", values(1))).toBe("1 of 120 matches")
    expect(en("filterMatches", values(12))).toBe("12 of 120 match")
    const ru = createTranslator(
      "dataTable",
      "ru-RU",
      tables["ru-RU.ts"] as never
    )
    expect(ru("filterMatches", values(1))).toBe("Совпадает 1 из 120")
    expect(ru("filterMatches", values(5))).toBe("Совпадают 5 из 120")
  })

  it("renders en-US first, then the provider's locale once it has loaded", async () => {
    function Label() {
      const t = useTranslations("tree")
      return <span>{t("expand")}</span>
    }
    render(
      <TectonProvider locale="fr-CA">
        <Label />
      </TectonProvider>
    )
    expect(screen.getByText("Expand")).toBeInTheDocument()
    expect(await screen.findByText("Développer")).toBeInTheDocument()
    // Loaded once: another component renders it at once.
    await loadTranslations("fr-FR")
    render(
      <TectonProvider locale="fr-FR">
        <Label />
      </TectonProvider>
    )
    expect(screen.getAllByText("Développer")).toHaveLength(2)
  })

  it("carries the power search's strings in every locale, each key translated", async () => {
    const english = (enUS as unknown as Table).dataTableQuery
    expect(Object.keys(english).length).toBeGreaterThan(0)
    for (const [file, table] of await locales()) {
      expect([file, "dataTableQuery" in table]).toEqual([file, true])
      const strings = table.dataTableQuery
      expect([file, Object.keys(strings).sort()]).toEqual([
        file,
        Object.keys(english).sort(),
      ])
      // Plural maps where en-US has them; the shared test checks placeholders.
      for (const [key, translation] of Object.entries(strings))
        if (typeof translation !== "string")
          expect([file, key, translation.other]).toEqual([
            file,
            key,
            expect.any(String),
          ])
    }
  })

  it("carries live data's strings in every locale, a form for each of its plural categories", async () => {
    const keys = [
      "rowsAdded",
      "newRows",
      "newRowsAbove",
      "newRowsBelow",
      "newRowsOnOtherPages",
      "showNewRows",
    ]
    for (const [file, table] of await locales()) {
      const categories = new Intl.PluralRules(
        file.replace(/\.ts$/, "")
      ).resolvedOptions().pluralCategories
      for (const key of keys) {
        const translation = table.dataTable[key]
        expect([file, key, typeof translation]).toEqual([file, key, "object"])
        const forms = translation as Record<string, string>
        // Spanish, French, Italian and Portuguese's "many" (a million rows)
        // reads as "other".
        for (const category of categories)
          if (category !== "many" || !/^(es|fr|it|pt)-/.test(file))
            expect([file, key, category, typeof forms[category]]).toEqual([
              file,
              key,
              category,
              "string",
            ])
      }
    }
  })

  it("renders the power search's strings in the provider's locale", async () => {
    function Label() {
      const t = useTranslations("dataTableQuery")
      return <span>{t("presetLastDays", { count: 30 })}</span>
    }
    render(
      <TectonProvider locale="de-DE">
        <Label />
      </TectonProvider>
    )
    expect(screen.getByText("Last 30 days")).toBeInTheDocument()
    expect(await screen.findByText("Letzte 30 Tage")).toBeInTheDocument()
    expect(
      createTranslator("dataTableQuery", "en-US")("summaryProblems", {
        count: 1,
        problems: "x",
      })
    ).toBe("1 problem: x")
  })

  it("translates memoized tree rows once the locale arrives", async () => {
    render(
      <TectonProvider locale="de-DE">
        <TreeView aria-label="Project" onMove={() => {}}>
          <TreeViewItem value="wells" label="Wells">
            <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
            <TreeViewItem value="a12" label="A-12">
              <TreeViewItemContent>A-12</TreeViewItemContent>
            </TreeViewItem>
          </TreeViewItem>
        </TreeView>
      </TectonProvider>
    )
    expect(
      await screen.findByRole("button", { name: "Wells ziehen" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Erweitern" })
    ).toBeInTheDocument()
  })

  it("types namespaces, keys, placeholders and locale tables", () => {
    const t = createTranslator("dragAndDrop", "en-US")
    expect(t("dropOnItem", { itemText: "Wells" })).toBe("Drop on Wells")
    expect(t("dropComplete")).toBe("Drop complete.")

    // These lines are checked by `tsc`, not run.
    const unchecked = () => {
      // @ts-expect-error -- no such key
      t("dropInto")
      // @ts-expect-error -- the placeholder value is missing
      t("dropOnItem")
      // @ts-expect-error -- a misspelled placeholder
      t("dropOnItem", { item: "Wells" })
      // @ts-expect-error -- a key without placeholders takes no values
      t("dropComplete", { itemText: "Wells" })
      // @ts-expect-error -- `count` is a number
      createTranslator("grid", "en-US")("selectedCount", { count: "3" })
      // @ts-expect-error -- no such namespace
      createTranslator("calendar", "en-US")
      defineTranslations({
        // @ts-expect-error -- the placeholders differ from en-US
        dragAndDrop: { dropOnItem: "Ablegen auf {item}" },
      })
      defineTranslations({
        // @ts-expect-error -- en-US has no such key
        tree: { open: "Öffnen" },
      })
      defineTranslations({
        // @ts-expect-error -- en-US has no such namespace
        calendar: { today: "Heute" },
      })
      defineTranslations({
        // @ts-expect-error -- en-US has a plural map here
        grid: { selectedCount: "{count} ausgewählt" },
      })
    }
    void unchecked
    // A partial, valid table compiles.
    expect(
      defineTranslations({
        dragAndDrop: { dropOnItem: "Ablegen auf {itemText}" },
      })
    ).toBeTruthy()
  })
})

void React
