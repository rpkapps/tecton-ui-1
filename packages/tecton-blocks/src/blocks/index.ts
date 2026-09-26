import type * as React from "react"

export type BlockCategory =
  | "application"
  | "authentication"
  | "dashboard"
  | "forms"
  | "layouts"
  | "lists"
  | "states"

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
    name: "shell-01",
    title: "Application shell",
    description:
      "The micro-frontend host: responsive top bar with app finder, context, command palette, help, overflow and user menu; the mounted application fills the region below.",
    category: "layouts",
    component: () => import("./shell-01/page"),
  },
  {
    name: "content-01",
    title: "Plain content page",
    description:
      "Single width-constrained column with a page header and a data-entry form; the layout for forms, tables and chat.",
    category: "layouts",
    component: () => import("./content-01/page"),
  },
  {
    name: "detail-01",
    title: "Detail page with section tabs",
    description:
      "Project details sidebar, page header with section tabs and a list / graph toggle, and a body of concept sections with decision cards.",
    category: "layouts",
    component: () => import("./detail-01/page"),
  },
  {
    name: "canvas-01",
    title: "Canvas with floating chrome",
    description:
      "Preset sidebar next to a full-bleed map with view selectors, tool rails, legend and scale bar floating over the surface.",
    category: "layouts",
    component: () => import("./canvas-01/page"),
  },
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
      "Icon navigation rail on the left and a resizable, closable tool panel on the right around the work area.",
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
    description:
      "Centred sign-in card with validation, remember-me, SSO and request-access link.",
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
  {
    name: "page-state",
    title: "Page state scaffold",
    description:
      "The shared layout of every page state: status row, code, title, actions and diagnostics next to an annotated well-log figure. Shown here as a page that is not available yet.",
    category: "states",
    component: () => import("./page-state/page"),
  },
  {
    name: "not-found-01",
    title: "404 · Not found",
    description:
      "Page not found: way back, command-palette search, likely pages for a stale link and the requested path; the log stops at TD.",
    category: "states",
    component: () => import("./not-found-01/page"),
  },
  {
    name: "forbidden-01",
    title: "403 · Access restricted",
    description:
      "No permission: inline access request with validation and a sent state, switch account; the lower log is locked.",
    category: "states",
    component: () => import("./forbidden-01/page"),
  },
  {
    name: "session-expired-01",
    title: "401 · Session expired",
    description:
      "Session timed out: unsaved-edits reassurance, password and SSO sign-in, return-to route; the log fades past the moment the session ended.",
    category: "states",
    component: () => import("./session-expired-01/page"),
  },
  {
    name: "server-error-01",
    title: "500 · Server error",
    description:
      "Unexpected error: retry, last saved view, copyable support report, collapsible stack trace; the log spikes off-scale at the anomaly.",
    category: "states",
    component: () => import("./server-error-01/page"),
  },
  {
    name: "maintenance-01",
    title: "503 · Scheduled maintenance",
    description:
      "Planned downtime: window progress, step checklist, status page and notify-me toggle; a hatched workover band crosses the log.",
    category: "states",
    component: () => import("./maintenance-01/page"),
  },
  {
    name: "offline-01",
    title: "Offline",
    description:
      "Connection lost: retry countdown, per-hop connection checks, work-offline fallback and queued edits; the log flat-lines after the last sample.",
    category: "states",
    component: () => import("./offline-01/page"),
  },
]

export const blockCategories: { id: BlockCategory; label: string }[] = [
  { id: "layouts", label: "Sidebars & layouts" },
  { id: "application", label: "Application" },
  { id: "dashboard", label: "Dashboard" },
  { id: "forms", label: "Forms" },
  { id: "lists", label: "Lists" },
  { id: "authentication", label: "Authentication" },
  { id: "states", label: "Page states" },
]

export function getBlock(name: string): BlockEntry | undefined {
  return blocks.find((block) => block.name === name)
}
