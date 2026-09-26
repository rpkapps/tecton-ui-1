"use client"

import * as React from "react"
import { cn } from "cn"

import { Panel, PanelFooter } from "@tecton/react/tecton/panel"

import { AgentComposer } from "./components/agent-composer"
import { AgentMessageList } from "./components/agent-message-list"
import { AgentPanelHeader } from "./components/agent-panel-header"
import {
  agentConversation,
  agentSuggestions,
  type AgentAction,
  type AgentMessage,
} from "./data"

/** Conversation state and actions shared by the panel and its host. */
type AgentConversation = {
  messages: AgentMessage[]
  completedActions: string[]
  isBusy: boolean
  send: (text: string) => void
  act: (action: AgentAction) => void
  stop: () => void
  clear: () => void
}

/**
 * The agent conversation with a mock reply. Keep it in the component that
 * outlives the panel (e.g. a dashboard that moves the panel between a docked
 * aside and a sheet) so the chat survives the move. Stop, clear and unmount
 * cancel every pending reply.
 */
function useAgentConversation(
  initialMessages: AgentMessage[] = agentConversation
): AgentConversation {
  const [messages, setMessages] =
    React.useState<AgentMessage[]>(initialMessages)
  const [completedActions, setCompleted] = React.useState<string[]>([])
  const [isBusy, setBusy] = React.useState(false)
  const busy = React.useRef(false)
  const replies = React.useRef(new Set<number>())

  const cancelReplies = React.useCallback(() => {
    for (const timer of replies.current) window.clearTimeout(timer)
    replies.current.clear()
  }, [])

  React.useEffect(() => cancelReplies, [cancelReplies])

  const stop = React.useCallback(() => {
    cancelReplies()
    busy.current = false
    setBusy(false)
  }, [cancelReplies])

  const send = React.useCallback((text: string) => {
    // One reply at a time: the composer and the chips are disabled while
    // busy, and this guards against a press that lands in between.
    if (busy.current) return
    busy.current = true
    setBusy(true)
    setMessages((current) => [
      ...current,
      { id: `u-${Date.now()}`, role: "user", content: text },
    ])
    const timer = window.setTimeout(() => {
      replies.current.delete(timer)
      busy.current = false
      setBusy(false)
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: [
            `I'll look into "${text}" and report back with the impact on cost, schedule and risk.`,
          ],
        },
      ])
    }, 900)
    replies.current.add(timer)
  }, [])

  const act = React.useCallback(
    (action: AgentAction) => {
      if (busy.current) return
      setCompleted((current) => [...current, action.id])
      send(action.label)
    },
    [send]
  )

  const clear = React.useCallback(() => {
    stop()
    setMessages([])
    setCompleted([])
  }, [stop])

  return { messages, completedActions, isBusy, send, act, stop, clear }
}

type AiAgentPanelProps = Omit<
  React.ComponentProps<typeof Panel>,
  "children"
> & {
  initialMessages?: AgentMessage[]
  suggestions?: string[]
  onClose?: () => void
  /**
   * Conversation owned by the host (from `useAgentConversation`). Without it
   * the panel keeps its own, which is lost when the panel unmounts.
   */
  conversation?: AgentConversation
}

/**
 * AI Agent side panel — header, scrolling conversation (assistant / user /
 * tool-activity messages with action chips) and a composer.
 */
function AiAgentPanel({
  className,
  initialMessages = agentConversation,
  suggestions = agentSuggestions,
  onClose,
  conversation: hosted,
  variant = "flat",
  ...props
}: AiAgentPanelProps) {
  const own = useAgentConversation(initialMessages)
  const { messages, completedActions, isBusy, send, act, stop, clear } =
    hosted ?? own

  return (
    <Panel
      data-slot="ai-agent-panel"
      variant={variant}
      className={cn("h-full", className)}
      {...props}
    >
      <AgentPanelHeader onClose={onClose} onClear={clear} />
      <AgentMessageList
        messages={messages}
        completedActions={completedActions}
        onAction={act}
        isBusy={isBusy}
      />
      <PanelFooter className="border-t-0 pt-0">
        <AgentComposer
          className="w-full"
          suggestions={messages.length === 0 ? suggestions : []}
          status={isBusy ? "submitted" : "ready"}
          onStop={stop}
          onSubmit={send}
        />
      </PanelFooter>
    </Panel>
  )
}

/** Route-ready page: the agent panel docked on the right of an empty canvas. */
export default function AiAgentPanelPage() {
  return (
    <div
      data-slot="ai-agent-panel-page"
      className="flex h-svh w-full bg-background text-foreground"
    >
      <div className="hidden min-w-0 flex-1 items-center justify-center p-6 text-sm text-muted-foreground md:flex">
        Well design canvas
      </div>
      <aside className="flex h-full w-full max-w-md shrink-0 flex-col border-s border-border-subtle bg-card">
        <AiAgentPanel />
      </aside>
    </div>
  )
}

export {
  AiAgentPanel,
  AgentPanelHeader,
  AgentMessageList,
  AgentComposer,
  useAgentConversation,
}
export { agentConversation, agentSuggestions } from "./data"
export type { AiAgentPanelProps, AgentConversation }
export type { AgentMessage, AgentAction, AgentToolStep } from "./data"
