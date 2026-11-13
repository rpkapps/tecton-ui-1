import type * as React from "react"

import { blocks as registry } from "@tecton/blocks"

import { readable } from "@/lib/preload"

export type BlockCategory =
  | "application"
  | "authentication"
  | "dashboard"
  | "forms"
  | "layouts"
  | "lists"
  | "states"

export type BlockMeta = {
  name: string
  title: string
  description: string
  category: BlockCategory
}

type BlockModule = { default: React.ComponentType }

export const blocks: (BlockMeta & { component: () => Promise<BlockModule> })[] =
  registry

export const blockCategories: { id: BlockCategory; title: string }[] = [
  { id: "layouts", title: "Sidebars & layouts" },
  { id: "application", title: "Application panels" },
  { id: "dashboard", title: "Dashboards" },
  { id: "forms", title: "Forms" },
  { id: "lists", title: "Lists & tables" },
  { id: "authentication", title: "Authentication" },
  { id: "states", title: "Page states" },
]

export function getBlock(name: string) {
  return blocks.find((block) => block.name === name)
}

const cache = new Map<string, Promise<React.ComponentType>>()

/** The block's component, loaded once, for `use()` (lib/preload.ts). */
export function loadBlock(name: string) {
  let promise = cache.get(name)
  if (!promise) {
    const block = getBlock(name)
    if (!block) throw new Error(`Unknown block: ${name}`)
    promise = readable(block.component().then((mod) => mod.default))
    cache.set(name, promise)
  }
  return promise
}
