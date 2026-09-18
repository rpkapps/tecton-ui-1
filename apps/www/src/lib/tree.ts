import * as React from "react"
import type * as PageTree from "fumadocs-core/page-tree"

export type TreeFolder = PageTree.Folder
export type TreePage = PageTree.Item

/** All pages of a folder, depth first (nested folders are flattened). */
export function getPagesFromFolder(folder: TreeFolder): TreePage[] {
  const pages: TreePage[] = []
  for (const child of folder.children) {
    if (child.type === "page") pages.push(child)
    else if (child.type === "folder") pages.push(...getPagesFromFolder(child))
  }
  return pages
}

/** Top-level folders of the tree (one sidebar / command-menu group each). */
export function getRootFolders(tree: PageTree.Root): TreeFolder[] {
  return tree.children.filter((node): node is TreeFolder => node.type === "folder")
}

/** A top-level entry of the tree: a page, or a folder linked through its index. */
export type TreeRootNode = TreePage | TreeFolder

/** Top-level entries under one `---Label---` separator of the root meta.json. */
export type TreeGroup = { label: string; nodes: TreeRootNode[] }

const UNLABELLED_GROUP = "Sections"

/**
 * Top-level entries grouped by the `---Label---` separators of the root
 * meta.json — the docs are split by audience, and the labels are what makes
 * that split visible. Entries before the first separator fall into one
 * unlabelled group, so a tree without separators renders as it always did.
 */
export function getRootGroups(tree: PageTree.Root): TreeGroup[] {
  const groups: TreeGroup[] = []
  let current: TreeGroup | undefined

  for (const node of tree.children) {
    if (node.type === "separator") {
      current = { label: nodeName(node) || UNLABELLED_GROUP, nodes: [] }
      groups.push(current)
      continue
    }
    if (!current) {
      current = { label: UNLABELLED_GROUP, nodes: [] }
      groups.push(current)
    }
    current.nodes.push(node)
  }

  return groups.filter((group) => group.nodes.length > 0)
}

/** Page a top-level entry links to: itself, or the folder's index page. */
export function rootNodeLink(node: TreeRootNode): TreePage | undefined {
  return node.type === "page" ? node : node.index
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
}

function decodeEntities(text: string) {
  return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity)
}

function nodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join("")
  if (
    React.isValidElement<{
      children?: React.ReactNode
      dangerouslySetInnerHTML?: { __html: string }
    }>(node)
  ) {
    // `useFumadocsLoader` turns names into <span dangerouslySetInnerHTML />.
    const html = node.props.dangerouslySetInnerHTML?.__html
    if (typeof html === "string") return decodeEntities(html.replace(/<[^>]+>/g, ""))
    return nodeText(node.props.children)
  }
  return ""
}

/**
 * Plain-text name of a page-tree node. Names deserialized by
 * `useFumadocsLoader` are React nodes, so the text is extracted recursively.
 */
export function nodeName(node: { name?: React.ReactNode }) {
  return nodeText(node.name).trim()
}
