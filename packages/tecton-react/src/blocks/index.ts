import type * as React from "react"

export type BlockCategory =
  | "application"
  | "authentication"
  | "dashboard"
  | "forms"
  | "layouts"
  | "lists"

export type BlockEntry = {
  /** Folder name under `src/blocks/`. */
  name: string
  title: string
  description: string
  category: BlockCategory
  /** Lazy import of the block's `page.tsx`; its default export is the page. */
  component: () => Promise<{ default: React.ComponentType }>
}

/** Registry consumed by the docs site gallery. */
export const blocks: BlockEntry[] = [
  {
    name: "sidebar-01",
    title: "Project navigation",
    description:
      "Sidebar that collapses to an icon rail: project switcher, grouped navigation with collapsible sections and the user menu.",
    category: "layouts",
    component: () => import("./sidebar-01/page"),
  },
  {
    name: "sidebar-02",
    title: "Inset sidebar",
    description:
      "Inset sidebar with search, flat navigation, recent projects with actions and secondary links pinned to the bottom.",
    category: "layouts",
    component: () => import("./sidebar-02/page"),
  },
  {
    name: "sidebar-03",
    title: "Project tree sidebar",
    description:
      "Off-canvas sidebar hosting the project inventory tree with search and visibility toggles next to a map work area.",
    category: "layouts",
    component: () => import("./sidebar-03/page"),
  },
  {
    name: "sidebar-04",
    title: "Navigation and tool panel",
    description:
      "Icon navigation rail on the left and a collapsible tool panel on the right around the work area.",
    category: "layouts",
    component: () => import("./sidebar-04/page"),
  },
  {
    name: "ai-agent-panel",
    title: "AI agent panel",
    description:
      "Chat side panel with assistant, user and tool-activity messages, action chips and a composer.",
    category: "application",
    component: () => import("./ai-agent-panel/page"),
  },
  {
    name: "horizons-panel",
    title: "Horizons panel",
    description:
      "Surface-pair form panel with depth fields, sliders, colour tags and an Apply footer.",
    category: "forms",
    component: () => import("./horizons-panel/page"),
  },
  {
    name: "facies-modeling-panel",
    title: "Facies modeling panel",
    description:
      "Stochastic facies (SEM) set-up: method and seed selects, variogram sliders, options and Run model.",
    category: "forms",
    component: () => import("./facies-modeling-panel/page"),
  },
  {
    name: "cost-vs-risk-panel",
    title: "Cost vs risk panel",
    description:
      "Quadrant bubble chart of well designs with legend chips and a cost / risk comparison bar list.",
    category: "application",
    component: () => import("./cost-vs-risk-panel/page"),
  },
  {
    name: "fda-comparison-table",
    title: "FDA comparison table",
    description:
      "Selectable data table ranking field development alternatives by NPV, CAPEX, risk and status.",
    category: "lists",
    component: () => import("./fda-comparison-table/page"),
  },
  {
    name: "fda-card",
    title: "FDA card",
    description:
      "Field development alternative summary: KPIs, complexity / risk / emissions meters and actions.",
    category: "application",
    component: () => import("./fda-card/page"),
  },
  {
    name: "well-design-card",
    title: "Well design card",
    description:
      "Well summary with trajectory sketch, TD / MD / inclination stats, phase progress and risk.",
    category: "application",
    component: () => import("./well-design-card/page"),
  },
  {
    name: "dashboard-01",
    title: "Dashboard",
    description:
      "Full app shell: top navigation, project tree sidebar, FDA and well cards, cost vs risk and the AI agent aside.",
    category: "dashboard",
    component: () => import("./dashboard-01/page"),
  },
  {
    name: "login-01",
    title: "Login",
    description: "Centred sign-in card with validation, remember-me, SSO and request-access link.",
    category: "authentication",
    component: () => import("./login-01/page"),
  },
  {
    name: "settings-01",
    title: "Settings",
    description:
      "Profile, notifications and appearance tabs with text / select fields, switches and a save footer.",
    category: "forms",
    component: () => import("./settings-01/page"),
  },
  {
    name: "list-01",
    title: "Wells list",
    description:
      "Filterable, paginated wells table with search, selects, status chips and an empty state.",
    category: "lists",
    component: () => import("./list-01/page"),
  },
]

export const blockCategories: { id: BlockCategory; label: string }[] = [
  { id: "layouts", label: "Sidebars & layouts" },
  { id: "application", label: "Application" },
  { id: "dashboard", label: "Dashboard" },
  { id: "forms", label: "Forms" },
  { id: "lists", label: "Lists" },
  { id: "authentication", label: "Authentication" },
]

export function getBlock(name: string): BlockEntry | undefined {
  return blocks.find((block) => block.name === name)
}
