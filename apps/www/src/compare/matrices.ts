import type * as React from "react"

export type CompareMatrix = {
  title: string
  /** Screenshot in tecton-screenshots/ this matrix mirrors. */
  reference: string
  load: () => Promise<{ default: React.ComponentType }>
}

/**
 * One state matrix per component family, mirroring the Tecton Storybook
 * "variant matrix" stories captured in tecton-screenshots/. The Playwright
 * script (apps/www/e2e/compare.spec.ts) renders each at /compare/<key> and
 * places the capture next to the reference PNG.
 */
export const compareMatrices: Record<string, CompareMatrix> = {
  button: {
    title: "Button — variant matrix",
    reference: "037_components-button__variant-matrix.png",
    load: () => import("./button"),
  },
  "icon-button": {
    title: "IconButton — variant matrix",
    reference: "064_components-iconbutton__variant-matrix.png",
    load: () => import("./icon-button"),
  },
  chip: {
    title: "Chip — variant matrix",
    reference: "042_components-chip__variant-matrix.png",
    load: () => import("./chip"),
  },
  alert: {
    title: "Alert — variant matrix",
    reference: "008_components-alert__variant-matrix.png",
    load: () => import("./alert"),
  },
  "text-field": {
    title: "TextField — variant matrix",
    reference: "105_components-textfield__variant-matrix.png",
    load: () => import("./text-field"),
  },
  select: {
    title: "Select — variant matrix",
    reference: "086_components-select__variant-matrix.png",
    load: () => import("./select"),
  },
  checkbox: {
    title: "Checkbox / Radio / Switch — state matrix",
    reference: "039_components-checkbox__variant-matrix.png",
    load: () => import("./selection-controls"),
  },
  tabs: {
    title: "Tabs — state matrix",
    reference: "097_components-tab__state-matrix.png",
    load: () => import("./tabs"),
  },
  table: {
    title: "Table — overview",
    reference: "100_components-table__overview.png",
    load: () => import("./table"),
  },
  badge: {
    title: "Badge (count) — all colours",
    reference: "024_components-badge__standard-all-colors.png",
    load: () => import("./badge"),
  },
  fab: {
    title: "FAB — variant matrix",
    reference: "058_components-fab__variant-matrix.png",
    load: () => import("./fab"),
  },
  progress: {
    title: "Progress — linear and circular",
    reference: "080_components-progress__overview.png",
    load: () => import("./progress"),
  },
  "tree-view": {
    title: "TreeView — state matrix",
    reference: "113_components-tree-view__state-matrix.png",
    load: () => import("./tree-view"),
  },
  divider: {
    title: "Divider — emphases",
    reference: "049_components-divider__variant-matrix.png",
    load: () => import("./divider"),
  },
  tokens: {
    title: "Colour tokens — swatches",
    reference: "114_foundations-colors__overview.png",
    load: () => import("./tokens"),
  },
}
