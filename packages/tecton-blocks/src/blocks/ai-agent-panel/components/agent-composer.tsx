"use client"

import * as React from "react"
import { MicIcon, PaperclipIcon } from "lucide-react"

import { InputGroupButton } from "@tecton/react/components/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/components/tooltip"
import {
  Composer,
  ComposerField,
  ComposerHint,
  ComposerInput,
  ComposerStatusMessage,
  ComposerSubmit,
  ComposerSuggestion,
  ComposerSuggestions,
  ComposerToolbar,
} from "@tecton/react/tecton/composer"

type AgentComposerProps = Omit<
  React.ComponentProps<typeof Composer>,
  "onSubmit" | "children"
> & {
  placeholder?: string
  suggestions?: string[]
  onSubmit?: (value: string) => void
}

function AgentComposer({
  placeholder = "What should we do next?",
  suggestions = [],
  disabled = false,
  onSubmit,
  ...props
}: AgentComposerProps) {
  // The block's slot goes on a wrapper that takes no box of its own: set on
  // the form, it would replace the Composer's own `data-slot="composer"`.
  return (
    <div data-slot="agent-composer" className="contents">
      <Composer
        disabled={disabled}
        onSubmit={({ text }) => onSubmit?.(text)}
        {...props}
      >
        {suggestions.length > 0 && (
          <ComposerSuggestions>
            {suggestions.map((suggestion) => (
              <ComposerSuggestion key={suggestion} value={suggestion} submit />
            ))}
          </ComposerSuggestions>
        )}
        <ComposerField>
          <ComposerInput placeholder={placeholder} />
          <ComposerToolbar>
            <Tooltip>
              <TooltipTrigger
                render={
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Attach file"
                    disabled={disabled}
                  />
                }
              >
                <PaperclipIcon />
              </TooltipTrigger>
              <TooltipContent>Attach</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Dictate"
                    disabled={disabled}
                  />
                }
              >
                <MicIcon />
              </TooltipTrigger>
              <TooltipContent>Dictate</TooltipContent>
            </Tooltip>
            <ComposerSubmit />
          </ComposerToolbar>
        </ComposerField>
        <ComposerHint visible={false} />
        <ComposerStatusMessage />
      </Composer>
    </div>
  )
}

export { AgentComposer }
export type { AgentComposerProps }
