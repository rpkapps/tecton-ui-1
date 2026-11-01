"use client"

/**
 * Internal to `@tecton/react`: a virtualizer `rangeExtractor` that keeps
 * `keep` rendered wherever the scroll is (the focused row, a drag's target),
 * on top of the rows in view.
 */
import * as React from "react"
import { defaultRangeExtractor, type Range } from "@tanstack/react-virtual"

function useKeepRange(keep: ReadonlyArray<number>) {
  // The virtualizer recomputes its rows when the extractor changes: keep it
  // the same function for the same indices.
  const key = keep.join(",")
  return React.useCallback(
    (range: Range) => {
      const indices = defaultRangeExtractor(range)
      if (!key) return indices
      const all = new Set(indices)
      for (const index of key.split(",").map(Number))
        if (index >= 0 && index < range.count) all.add(index)
      return all.size === indices.length
        ? indices
        : [...all].sort((a, b) => a - b)
    },
    [key]
  )
}

export { useKeepRange }
