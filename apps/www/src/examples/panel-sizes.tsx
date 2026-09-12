import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@tecton/react/tecton/panel"

export default function PanelSizes() {
  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Panel key={size} size={size}>
          <PanelHeader>
            <PanelTitle>Size {size}</PanelTitle>
            <PanelDescription>Padding scales with size.</PanelDescription>
          </PanelHeader>
          <PanelContent className="text-sm text-muted-foreground">Content</PanelContent>
        </Panel>
      ))}
    </div>
  )
}
