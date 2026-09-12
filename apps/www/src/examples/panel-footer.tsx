import { Button } from "@tecton/react/components/button"
import { Meter } from "@tecton/react/tecton/meter"
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

export default function PanelFooterExample() {
  return (
    <Panel className="h-72 w-full max-w-sm" variant="elevated">
      <PanelHeader>
        <PanelTitle>Alternative B</PanelTitle>
        <PanelDescription>4 wells, 1 template — base case</PanelDescription>
      </PanelHeader>
      <PanelContent className="flex flex-col gap-4">
        <Meter label="Geological risk" value={30} color="auto" valueLabel="Low" />
        <Meter label="Drilling complexity" value={70} color="auto" valueLabel="High" />
        <Meter label="Confidence" value={85} color="info" showValue />
      </PanelContent>
      <PanelFooter className="justify-end">
        <Button variant="ghost" size="sm">
          Compare
        </Button>
        <Button size="sm">Open</Button>
      </PanelFooter>
    </Panel>
  )
}
