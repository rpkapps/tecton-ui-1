import type * as React from "react"
import {
  BoxIcon,
  ChartColumnIcon,
  DrillIcon,
  FileTextIcon,
  GitCompareIcon,
  LayoutDashboardIcon,
  LeafIcon,
  MountainIcon,
} from "lucide-react"

export type Project = {
  id: string
  name: string
  asset: string
  phase: string
}

export type NavItem = {
  title: string
  url: string
  icon: React.ElementType
  isActive?: boolean
  /** Count shown in a menu badge. */
  badge?: string
  items?: { title: string; url: string; isActive?: boolean }[]
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const projects: Project[] = [
  { id: "jsp3", name: "Johan Sverdrup Phase 3", asset: "North Sea · PL 265", phase: "Concept select" },
  { id: "troll-w", name: "Troll West", asset: "North Sea · PL 054", phase: "Execute" },
  { id: "snorre-x", name: "Snorre Expansion", asset: "Tampen · PL 057", phase: "Define" },
]

export const navGroups: NavGroup[] = [
  {
    label: "Project",
    items: [
      { title: "Overview", url: "#", icon: LayoutDashboardIcon, isActive: true },
      {
        title: "Wells",
        url: "#",
        icon: DrillIcon,
        badge: "4",
        items: [
          { title: "34/10-A-12 H", url: "#" },
          { title: "34/10-A-14 H", url: "#" },
          { title: "34/10-A-16", url: "#" },
          { title: "34/10-B-3 AH", url: "#" },
        ],
      },
      { title: "Horizons", url: "#", icon: MountainIcon, badge: "6" },
      {
        title: "Models",
        url: "#",
        icon: BoxIcon,
        items: [
          { title: "Facies Model 01", url: "#" },
          { title: "Facies Model 02 (SIS)", url: "#" },
          { title: "Velocity model v3", url: "#" },
        ],
      },
      { title: "Field development", url: "#", icon: GitCompareIcon },
    ],
  },
  {
    label: "Analysis",
    items: [
      { title: "Cost vs risk", url: "#", icon: ChartColumnIcon },
      { title: "Emissions", url: "#", icon: LeafIcon },
      { title: "Reports", url: "#", icon: FileTextIcon },
    ],
  },
]

export const currentUser = {
  name: "Lena Haugen",
  initials: "LH",
  role: "Subsurface lead",
  email: "lena.haugen@example.com",
}

export const breadcrumbs = [
  { title: "Johan Sverdrup Phase 3", url: "#" },
  { title: "Overview" },
]
