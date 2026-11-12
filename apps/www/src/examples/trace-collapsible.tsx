// Synced from shadcn/ui (apps/v4/examples/base/trace-collapsible.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { TerminalIcon } from "lucide-react"

import { CodeBlock, CodeBlockContent } from "@tecton/react/code-block"
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@tecton/react/trace"

export function TraceCollapsibleDemo() {
  return (
    <div className="w-full max-w-sm">
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceIcon>
              <TerminalIcon />
            </TraceIcon>
            <TraceTitle>Ran node --version</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <CodeBlock size="sm">
            <CodeBlockContent wrap className="max-h-64">
              {"$ node --version\nv24.18.0"}
            </CodeBlockContent>
          </CodeBlock>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </div>
  )
}
