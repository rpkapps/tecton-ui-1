import {
  TreeView,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

export default function TreeViewStates() {
  return (
    <TreeView
      aria-label="Horizons"
      className="max-w-sm"
      selectionMode="multiple"
      defaultSelectedKeys={["sele"]}
      disabledKeys={["brent"]}
      defaultExpandedKeys={["horizons"]}
    >
      <TreeViewItem id="horizons" textValue="Horizons">
        <TreeViewItemContent kind="folder">Horizons</TreeViewItemContent>
        <TreeViewItem id="balder" textValue="Top Balder">
          <TreeViewItemContent>Top Balder</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="sele" textValue="Top Sele (selected)">
          <TreeViewItemContent>Top Sele (selected)</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="bcu" textValue="Base Cretaceous (hidden)" isHidden>
          <TreeViewItemContent>Base Cretaceous (hidden)</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="brent" textValue="Top Brent (disabled)">
          <TreeViewItemContent>Top Brent (disabled)</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
    </TreeView>
  )
}
