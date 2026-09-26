import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

export default function TreeViewDemo() {
  return (
    <TreeView
      aria-label="Project"
      className="max-w-sm"
      selectionMode="single"
      defaultExpanded={["wells"]}
    >
      <TreeViewItem value="wells">
        <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
        <TreeViewItem value="a12">
          <TreeViewItemContent>34/10-A-12</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="b3">
          <TreeViewItemContent>34/10-B-3</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem value="horizons">
        <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
        <TreeViewItem value="balder">
          <TreeViewItemContent>Top Balder</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
    </TreeView>
  )
}
