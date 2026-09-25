"use client"

import * as React from "react"
import { MicIcon, PaperclipIcon } from "lucide-react"

import { InputGroupButton } from "@tecton/react/components/input-group"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"
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
  isDisabled = false,
  onSubmit,
  ...props
}: AgentComposerProps) {
  return (
    <Composer
      data-slot="agent-composer"
      isDisabled={isDisabled}
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
          <TooltipTrigger>
            <InputGroupButton
              size="icon-xs"
              aria-label="Attach file"
              isDisabled={isDisabled}
            >
              <PaperclipIcon />
            </InputGroupButton>
            <Tooltip>Attach</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger>
            <InputGroupButton
              size="icon-xs"
              aria-label="Dictate"
              isDisabled={isDisabled}
            >
              <MicIcon />
            </InputGroupButton>
            <Tooltip>Dictate</Tooltip>
          </TooltipTrigger>
          <ComposerSubmit />
        </ComposerToolbar>
      </ComposerField>
      <ComposerHint isVisible={false} />
      <ComposerStatusMessage />
    </Composer>
  )
}

export { AgentComposer }
export type { AgentComposerProps }
