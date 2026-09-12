import { Panel, PanelContent, PanelHeader, PanelTitle } from "@tecton/react/tecton/panel"

const variants = ["default", "elevated", "flat", "outline"] as const

export default function PanelVariants() {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      {variants.map((variant) => (
        <Panel key={variant} variant={variant}>
          <PanelHeader>
            <PanelTitle className="capitalize">{variant}</PanelTitle>
          </PanelHeader>
          <PanelContent className="text-sm text-muted-foreground">
            variant="{variant}"
          </PanelContent>
        </Panel>
      ))}
    </div>
  )
}
