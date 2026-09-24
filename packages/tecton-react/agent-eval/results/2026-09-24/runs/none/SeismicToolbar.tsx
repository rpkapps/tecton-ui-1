import * as React from "react";
import { Button } from "@tecton/react/button";
import { Toggle } from "@tecton/react/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@tecton/react/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/dropdown-menu";
import { Fault } from "@tecton/react/icons";
import { ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";

export function SeismicToolbar({
  onZoomIn,
  onZoomOut,
  onReset,
  showFaults,
  onShowFaultsChange,
  onExport,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  showFaults: boolean;
  onShowFaultsChange: (show: boolean) => void;
  onExport: (format: "png" | "segy") => void;
}) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-md border bg-card p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom in"
              onClick={onZoomIn}
            >
              <ZoomIn />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom out"
              onClick={onZoomOut}
            >
              <ZoomOut />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset view"
              onClick={onReset}
            >
              <RotateCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset view</TooltipContent>
        </Tooltip>

        <div className="mx-1 h-6 w-px bg-border" />

        <Toggle
          pressed={showFaults}
          onPressedChange={onShowFaultsChange}
          aria-label="Show faults"
          size="sm"
        >
          <Fault />
          Show faults
        </Toggle>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport("png")}>
              PNG image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("segy")}>
              SEG-Y
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
