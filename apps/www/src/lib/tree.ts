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

/** Top-level pages of the tree (the "Sections" group of the sidebar). */
export function getRootPages(tree: PageTree.Root): TreePage[] {
  return tree.children.filter((node): node is TreePage => node.type === "page")
}

/** Top-level folders of the tree (one sidebar / command-menu group each). */
export function getRootFolders(tree: PageTree.Root): TreeFolder[] {
  return tree.children.filter(
    (node): node is TreeFolder => node.type === "folder"
  )
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
}

function decodeEntities(text: string) {
  return text.replace(
    /&(?:amp|lt|gt|quot|#39);/g,
    (entity) => ENTITIES[entity] ?? entity
  )
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
    if (typeof html === "string")
      return decodeEntities(html.replace(/<[^>]+>/g, ""))
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
