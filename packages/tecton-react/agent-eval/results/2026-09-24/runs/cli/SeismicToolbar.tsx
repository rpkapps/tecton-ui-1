import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Toggle } from "@tecton/react/components/toggle"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"
import { FaultIcon } from "@tecton/react/icons"
import {
  DownloadIcon,
  RotateCcwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

export function SeismicToolbar({
  onZoomIn,
  onZoomOut,
  onReset,
  showFaults,
  onShowFaultsChange,
  onExport,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  showFaults: boolean
  onShowFaultsChange: (show: boolean) => void
  onExport: (format: "png" | "segy") => void
}) {
  return (
    <div className="flex items-center gap-2">
      <ButtonGroup aria-label="View controls">
        <TooltipTrigger>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Zoom in"
            onPress={onZoomIn}
          >
            <ZoomInIcon />
          </Button>
          <Tooltip>Zoom in</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Zoom out"
            onPress={onZoomOut}
          >
            <ZoomOutIcon />
          </Button>
          <Tooltip>Zoom out</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Reset view"
            onPress={onReset}
          >
            <RotateCcwIcon />
          </Button>
          <Tooltip>Reset view</Tooltip>
        </TooltipTrigger>
      </ButtonGroup>

      <Toggle
        variant="outline"
        isSelected={showFaults}
        onChange={onShowFaultsChange}
        aria-label="Show faults"
      >
        <FaultIcon data-icon="inline-start" />
        Show faults
      </Toggle>

      <DropdownMenuTrigger>
        <Button variant="outline">
          <DownloadIcon data-icon="inline-start" />
          Export
        </Button>
        <DropdownMenu
          onAction={(key) => {
            const id = String(key)
            if (id === "png" || id === "segy") {
              onExport(id)
            }
          }}
        >
          <DropdownMenuItem id="png">PNG image</DropdownMenuItem>
          <DropdownMenuItem id="segy">SEG-Y</DropdownMenuItem>
        </DropdownMenu>
      </DropdownMenuTrigger>
    </div>
  )
}
