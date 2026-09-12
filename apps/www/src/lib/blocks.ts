import type * as React from "react"

import { blocks as registry } from "@tecton/react/blocks/index"

export type BlockCategory =
  | "application"
  | "authentication"
  | "dashboard"
  | "forms"
  | "lists"

export type BlockMeta = {
  name: string
  title: string
  description: string
  category: BlockCategory
}

type BlockModule = { default: React.ComponentType }

export const blocks: (BlockMeta & { component: () => Promise<BlockModule> })[] =
  registry as never

export const blockCategories: { id: BlockCategory; title: string }[] = [
  { id: "application", title: "Application panels" },
  { id: "dashboard", title: "Dashboards" },
  { id: "forms", title: "Forms" },
  { id: "lists", title: "Lists & tables" },
  { id: "authentication", title: "Authentication" },
]

export function getBlock(name: string) {
  return blocks.find((block) => block.name === name)
}

const cache = new Map<string, Promise<React.ComponentType>>()

export function loadBlock(name: string) {
  let promise = cache.get(name)
  if (!promise) {
    const block = getBlock(name)
    if (!block) throw new Error(`Unknown block: ${name}`)
    promise = block.component().then((mod) => mod.default)
    cache.set(name, promise)
  }
  return promise
}
