// Synced from shadcn/ui (apps/v4/examples/aria/combobox-invalid.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@tecton/react/components/combobox"

const frameworks = [
  "Next.js",
  "SvelteKit",
  "Nuxt.js",
  "Remix",
  "Astro",
] as const

export function ComboboxInvalid() {
  return (
    <Combobox allowsEmptyCollection isInvalid aria-label="Framework">
      <ComboboxInput placeholder="Select a framework" />
      <ComboboxContent>
        <ComboboxList
          renderEmptyState={() => (
            <ComboboxEmpty>No items found.</ComboboxEmpty>
          )}
        >
          {frameworks.map((item) => (
            <ComboboxItem key={item} id={item}>
              {item}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
