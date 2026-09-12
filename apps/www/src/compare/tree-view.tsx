import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import {
  TreeView,
  TreeViewAction,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewVisibilityToggle,
} from "@tecton/react/tecton/tree-view"

import { Matrix, Page } from "./matrix"

/**
 * Mirrors 113_components-tree-view__state-matrix.png ("Tree item visual
 * states, expansion, nesting, hidden items, and suffixes"). Columns: an
 * expanded folder with one child, a collapsed folder, and a leaf item.
 * Rows: rest · selected · disabled · hidden · with suffix. Hovered /
 * focused / pressed are not forceable and are omitted.
 */
type State = "rest" | "selected" | "disabled" | "hidden" | "suffix"

const rows: { label: string; state: State }[] = [
  { label: "Rest", state: "rest" },
  { label: "Selected", state: "selected" },
  { label: "Disabled", state: "disabled" },
  { label: "Hidden", state: "hidden" },
  { label: "With suffix", state: "suffix" },
]

const FOLDER = "K70: Spekk fm top"
const CHILD = "J72: Reservoir interval"

function ColorTag({ round }: { round?: boolean }) {
  return <span className={round ? "rounded-full bg-success" : "bg-success"} />
}

function Tree({
  state,
  kind,
}: {
  state: State
  kind: "folder" | "collapsed" | "item"
}) {
  const hidden = state === "hidden"
  const suffix =
    state === "suffix" ? <Badge variant="info">Badge</Badge> : undefined
  const endAdornment = hidden ? (
    <TreeViewVisibilityToggle isVisible={false} />
  ) : (
    <TreeViewAction aria-label="Actions" />
  )

  return (
    <TreeView
      aria-label={`${kind} ${state}`}
      selectionMode="single"
      defaultSelectedKeys={state === "selected" ? ["root"] : []}
      disabledKeys={state === "disabled" ? ["root", "child"] : []}
      defaultExpandedKeys={kind === "folder" ? ["root"] : []}
      className="w-80 rounded-md bg-card p-1"
    >
      {kind === "item" ? (
        <TreeViewItem id="root" textValue={CHILD} isHidden={hidden}>
          <TreeViewItemContent
            kind="item"
            colorTag={<ColorTag round />}
            suffix={suffix}
            endAdornment={endAdornment}
          >
            {CHILD}
          </TreeViewItemContent>
        </TreeViewItem>
      ) : (
        <TreeViewItem id="root" textValue={FOLDER} isHidden={hidden}>
          <TreeViewItemContent
            kind="folder"
            colorTag={<ColorTag />}
            suffix={suffix}
            endAdornment={endAdornment}
          >
            {FOLDER}
          </TreeViewItemContent>
          <TreeViewItem id="child" textValue={CHILD} isHidden={hidden}>
            <TreeViewItemContent kind="item" colorTag={<ColorTag round />}>
              {CHILD}
            </TreeViewItemContent>
          </TreeViewItem>
        </TreeViewItem>
      )}
    </TreeView>
  )
}

export default function TreeViewMatrix() {
  return (
    <Page>
      <Matrix
        columns={["Folder (expanded)", "Folder (collapsed)", "Item"]}
        rows={rows.map(({ label, state }) => ({
          label,
          cells: [
            <Tree key="folder" state={state} kind="folder" />,
            <Tree key="collapsed" state={state} kind="collapsed" />,
            <Tree key="item" state={state} kind="item" />,
          ],
        }))}
        cellClassName="items-start"
      />
    </Page>
  )
}
