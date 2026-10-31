"use client"

import * as React from "react"

import { defineTreeCollection, renderCollection } from "./collection"

type TreeCollectionProps<T> = {
  /** Data for the child rows. */
  items: Iterable<T>
  /** Renders one row per entry. */
  children: (item: T) => React.ReactNode
}

/**
 * Child rows rendered from data. The tree reads them without rendering
 * this component; it only renders where a row is used outside a tree.
 */
function TreeCollection<T>({ items, children }: TreeCollectionProps<T>) {
  return (
    <>
      {renderCollection(items, children as (item: unknown) => React.ReactNode)}
    </>
  )
}

defineTreeCollection(TreeCollection, (props: TreeCollectionProps<unknown>) => ({
  items: props.items,
  render: props.children,
}))

export { TreeCollection }
export type { TreeCollectionProps }
