/**
 * The /compare/<key> state matrices (see matrices.ts). A plain list with no
 * imports, so vite.config.ts can prerender every matrix page.
 */
export const compareKeys = [
  "button",
  "icon-button",
  "chip",
  "alert",
  "input",
  "select",
  "checkbox",
  "tabs",
  "table",
  "badge",
  "fab",
  "progress",
  "tree-view",
  "separator",
  "tokens",
] as const

export type CompareKey = (typeof compareKeys)[number]

export function isCompareKey(value: string): value is CompareKey {
  return (compareKeys as readonly string[]).includes(value)
}
