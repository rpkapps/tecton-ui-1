import * as React from "react";
import { X } from "lucide-react";
import { Badge, Button } from "@tecton/react";

export function HorizonFilter({
  horizons,
  selected,
  onChange,
}: {
  horizons: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggleHorizon = (horizon: string) => {
    if (selected.includes(horizon)) {
      onChange(selected.filter((h) => h !== horizon));
    } else {
      onChange([...selected, horizon]);
    }
  };

  const removeHorizon = (horizon: string) => {
    onChange(selected.filter((h) => h !== horizon));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {horizons.map((horizon) => {
          const isSelected = selected.includes(horizon);
          return (
            <Badge
              key={horizon}
              asChild
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer select-none"
            >
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleHorizon(horizon)}
              >
                {horizon}
              </button>
            </Badge>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Active filters:</span>
          {selected.map((horizon) => (
            <Badge key={horizon} variant="secondary" className="gap-1 pr-1">
              {horizon}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-4 rounded-full"
                aria-label={`Remove ${horizon} filter`}
                onClick={() => removeHorizon(horizon)}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
