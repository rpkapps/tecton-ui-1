"use client"

import * as React from "react"

import { Bubble, BubbleContent } from "@tecton/react/components/bubble"
import { Message, MessageContent } from "@tecton/react/components/message"
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@tecton/react/components/message-scroller"
import {
  Composer,
  ComposerField,
  ComposerHint,
  ComposerInput,
  ComposerStatusMessage,
  ComposerSubmit,
  ComposerToolbar,
  type ComposerStatus,
} from "@tecton/react/tecton/composer"

type Turn = { id: string; role: "user" | "assistant"; text: string }

const REPLY =
  "Separator 2 has been degraded since 06:40. Its level alarm cleared twice this shift; I would check the dump valve before the next test."

export default function ComposerDemo() {
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [status, setStatus] = React.useState<ComposerStatus>("ready")
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = () => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setStatus("ready")
  }

  React.useEffect(() => () => stop(), [])

  const send = (text: string) => {
    const id = String(Date.now())
    setTurns((current) => [
      ...current,
      { id: `u-${id}`, role: "user", text },
      { id: `a-${id}`, role: "assistant", text: "" },
    ])
    setStatus("submitted")
    const words = REPLY.split(" ")
    let index = 0
    timer.current = setInterval(() => {
      index += 1
      setStatus("streaming")
      setTurns((current) =>
        current.map((turn) =>
          turn.id === `a-${id}`
            ? { ...turn, text: words.slice(0, index).join(" ") }
            : turn
        )
      )
      if (index >= words.length) stop()
    }, 80)
  }

  return (
    <div className="flex h-96 w-full max-w-md flex-col gap-3">
      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller className="flex-1 rounded-md border">
          <MessageScrollerViewport className="px-3 py-2">
            <MessageScrollerContent
              className="gap-3"
              aria-busy={status === "streaming"}
            >
              {turns.map((turn) => (
                <MessageScrollerItem
                  key={turn.id}
                  messageId={turn.id}
                  scrollAnchor={turn.role === "user"}
                >
                  <Message align={turn.role === "user" ? "end" : "start"}>
                    <MessageContent>
                      <Bubble
                        variant={turn.role === "user" ? "secondary" : "ghost"}
                        align={turn.role === "user" ? "end" : "start"}
                      >
                        <BubbleContent>{turn.text || "…"}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>

      <Composer
        status={status}
        onStop={stop}
        onSubmit={({ text }) => send(text)}
        onRecallLast={() =>
          [...turns].reverse().find((turn) => turn.role === "user")?.text
        }
      >
        <ComposerField>
          <ComposerInput placeholder="Ask about separator 2…" />
          <ComposerToolbar>
            <ComposerSubmit />
          </ComposerToolbar>
        </ComposerField>
        <ComposerHint />
        <ComposerStatusMessage />
      </Composer>
    </div>
  )
}
