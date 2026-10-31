import * as React from "react"
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TectonProvider } from "@tecton/react/tecton/provider"
import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

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
