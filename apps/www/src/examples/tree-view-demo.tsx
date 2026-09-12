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
      defaultExpandedKeys={["wells"]}
    >
      <TreeViewItem id="wells" textValue="Wells">
        <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
        <TreeViewItem id="a12" textValue="34/10-A-12">
          <TreeViewItemContent>34/10-A-12</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="b3" textValue="34/10-B-3">
          <TreeViewItemContent>34/10-B-3</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem id="horizons" textValue="Horizons">
        <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
        <TreeViewItem id="balder" textValue="Top Balder">
          <TreeViewItemContent>Top Balder</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
    </TreeView>
  )
}
