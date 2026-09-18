# Message Scroller

A chat scroll container that anchors turns, opens saved transcripts, follows streamed responses, loads history without jumping, and jumps to any message.

Source: /docs/components/message-scroller.md

## What Makes a Great Streaming Chat Experience

Building a chat interface used to be simple. You create an inverted list with
an input. Type a message, it appends at the bottom. When a reply comes in, the
list grows and scrolls. Done.

Streaming breaks that model. Messages arrive in chunks while you may still be
reading, scrolling, or looking somewhere else entirely.

Now the challenge is preserving the reader's place while the conversation keeps
changing. Get that wrong and the experience feels jumpy: people are pulled to
the bottom, lose context, and have to find their way back.

In practice, this comes down to scroll: when to follow, when to hold, and when
to let the reader decide. A great streaming chat should:

1. **Move only when the reader asked to move.** If someone is reading, don’t pull them somewhere else. Auto-scroll should never be the default.
2. **Follow only while they’re following.** If they’re at the live edge, keep the stream in view. If they scroll away, leave them there.
3. **Every interaction is a signal.** Scrolling is not the only one. Selecting text, using the keyboard, opening a link, or searching should all stop the interface from moving.
4. **Start a new turn near the top of the viewport.** This gives the new turn somewhere it can be read from the beginning.
5. **Then stream in the answer.** The answer should grow into the screen, not immediately push everything away.
6. **Keep part of the previous conversation in context.** The prompt and reply should stay visually connected, and enough of the previous turn should remain visible so the reader knows where they are.
7. **Let new content arrive offscreen.** The conversation can keep streaming without changing what the reader is looking at.
8. **Show what’s happening out of view.** Make it clear when a response is still streaming or when new messages have arrived.
9. **Make it easy to return to the latest reply.** A “Jump to latest” action should bring the reader back and resume following.
10. **Let people jump anywhere in the conversation.** Long threads need message links, search, unread markers, and direct navigation.
11. **Reopen where the reader left off.** A saved conversation should open at the last meaningful turn. Often this is the last user message. Not the absolute bottom.
12. **Keep the reader’s place when layout changes.** Images load. Markdown expands. Code blocks render. Older messages appear above. None of that should make the reader lose their place.
13. **Handle interruptions without stealing position.** Stopping, retrying, regenerating, branching, or errors should not unexpectedly move the conversation.
14. **Stay responsive in long threads.** Streaming text, markdown, code, images, and long history should still feel responsive.
15. **Be accessible without the noise.** Keep the transcript navigable, preserve keyboard focus, and announce important events at a comfortable pace.

**Never move the reader against their intent.**

## MessageScroller

MessageScroller is a chat transcript scroller built for these behaviors.
`MessageScrollerProvider` owns the scroll state and transcript-row behavior:
opening position, streamed output, new-turn anchoring, prepended history,
visibility, and scroll controls. `MessageScroller` is the styled frame that
renders inside it.

MessageScroller is scoped to the scroll viewport. It does not own messages, AI state,
transport, persistence, branching, or model state. Your product code stays
focused on composing messages, markers, tools, attachments, and prompt inputs.

It gives you the scroll behavior that chat needs, without taking over the rest
of the chat UI. And it stays fast, even in long conversations with rich
markdown.

## Usage

```tsx
import { Message } from "@tecton/react/components/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@tecton/react/components/message-scroller"
```

```tsx
<MessageScrollerProvider>
  <MessageScroller>
    <MessageScrollerViewport>
      <MessageScrollerContent>
        {messages.map((message) => (
          <MessageScrollerItem
            key={message.id}
            messageId={message.id}
            scrollAnchor={message.role === "user"}
          >
            <Message />
          </MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>
```

`MessageScroller` fills its parent, so place it inside a height-constrained
container.

```tsx
<div className="flex h-screen flex-col">
  <MessageScrollerProvider>
    <MessageScroller className="flex-1">{/* transcript */}</MessageScroller>
  </MessageScrollerProvider>
</div>
```

## Composition

```tsx
<MessageScrollerProvider>
  <MessageScroller>
    <MessageScrollerViewport>
      <MessageScrollerContent>
        <MessageScrollerItem>
          {/* a message, marker, or row */}
        </MessageScrollerItem>
        <MessageScrollerItem />
        <MessageScrollerItem />
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>
```

- **`MessageScrollerProvider`** — the headless root. Owns scroll state and the
  behavior props for opening position, auto-scroll, anchoring, scroll commands,
  and visibility tracking.
- **`MessageScroller`** — the styled frame. Lays out the viewport, content, and
  controls inside the provider.
- **`MessageScrollerViewport`** — the scrollable element. Receives native scroll
  events and preserves the visible row when older messages are prepended.
- **`MessageScrollerContent`** — the transcript container. Holds the rows and
  provides the live-region defaults for new messages.
- **`MessageScrollerItem`** — the transcript row boundary. Wrap every direct
  child of the content so the scroller can measure, anchor, preserve position,
  track visibility, and jump to it. An item can be a message, marker, typing
  indicator, separator, join/leave event, or "load earlier" row.
- **`MessageScrollerButton`** — the scroll control. Scrolls to the start or end of the transcript and is inert until there is content in its direction.

## Core Concepts

### Anchoring Turns

A turn is the part of the conversation that starts a new exchange. In a simple
AI chat, that is usually the user's message and the assistant reply that follows.

An anchor is the row the viewport should treat as the start of that turn. Mark
that row with `scrollAnchor`. When a new anchor is appended, the viewport moves
it near the top and keeps a peek of the previous item above it, so the new turn
does not feel detached from its context.

```tsx
// This tells the scroller to anchor the user's message for the next turn.
<MessageScrollerItem
  messageId={message.id}
  scrollAnchor={message.role === "user"}
/>
```

Scroll anchors are not tied to message role. You can turn any row into an anchor:
a user message, a system marker, a handoff event, or anything else that starts a
meaningful turn. `MessageScroller` only needs to know which row should anchor the
viewport.

In the following example, the user's message is anchored. When you send a new message, the viewport anchors it near the top and appends the assistant reply below it. Toggle the anchor to the assistant's message to see the difference.

### Group Chat

In a group chat, the turn boundary is more specific than "the user message". It is often
the message that asks the model to respond, or a marker like "Marcus joined the
chat". Typing indicators and history controls usually should not anchor.

Because anchoring is role-independent, you can anchor a marker just as easily as
a message.

```tsx
<MessageScrollerItem messageId="marcus-joined" scrollAnchor>
  <Marker variant="separator">
    <MarkerContent>Marcus joined the chat</MarkerContent>
  </Marker>
</MessageScrollerItem>
```

**Example — `message-scroller-group-chat`**

```tsx
"use client"

import * as React from "react"
import { RotateCwIcon } from "lucide-react"

import { Bubble, BubbleContent } from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import { Marker, MarkerContent } from "@tecton/react/components/marker"
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@tecton/react/components/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@tecton/react/components/message-scroller"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

const currentUser = "Grace"

const initialItems = [
  {
    id: "group-1",
    type: "message",
    sender: "Grace",
    role: "participant",
    text: "@mary, the astrophage line keeps matching Venus energy output. Can you check my math?",
  },
  {
    id: "group-2",
    type: "message",
    sender: "Mary (Agent)",
    role: "assistant",
    text: "Yes. Confirmed. The curve points to a microorganism harvesting stellar energy and breeding near carbon dioxide. If @rocky agrees, this is the clue we need.",
  },
  {
    id: "group-3",
    type: "message",
    sender: "Grace",
    role: "participant",
    text: "ping @rocky",
    scrollAnchor: true,
  },
] satisfies GroupChatItem[]

const rockyMarker = {
  id: "group-4",
  type: "event",
  text: "Rocky has joined the chat",
  scrollAnchor: true,
} satisfies GroupChatItem

const rockyMessage = {
  id: "group-5",
  type: "message",
  sender: "Rocky",
  role: "participant",
  text: "Amaze. Astrophage eats light, makes heat, goes to carbon dioxide. Rocky has fuel model. Grace is smart.",
} satisfies GroupChatItem

type GroupChatItem =
  | {
      id: string
      type: "event"
      text: string
      scrollAnchor?: boolean
    }
  | {
      id: string
      type: "message"
      sender: string
      role: "assistant" | "participant"
      text: string
      scrollAnchor?: boolean
    }

export function MessageScrollerGroupChat() {
  const [demoKey, setDemoKey] = React.useState(0)
  const [rockyTurn, setRockyTurn] = React.useState<
    "idle" | "marker" | "message"
  >("idle")
  const items =
    rockyTurn === "message"
      ? [...initialItems, rockyMarker, rockyMessage]
      : rockyTurn === "marker"
        ? [...initialItems, rockyMarker]
        : initialItems
  const buttonLabel =
    rockyTurn === "idle" ? "Add Rocky" : "Send Message as Rocky"
  const isComplete = rockyTurn === "message"

  return (
    <MessageScrollerProvider>
      <div className="relative flex flex-col gap-4">
        <Card className="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader className="gap-1 border-b">
            <CardTitle>Group Chat</CardTitle>
            <CardDescription>
              A group chat with several participants and an assistant. The
              Marker is marked as a turn.
            </CardDescription>
            <CardAction>
              <TooltipTrigger>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Reset conversation"
                  isDisabled={rockyTurn === "idle"}
                  onPress={() => {
                    setRockyTurn("idle")
                    setDemoKey((key) => key + 1)
                  }}
                >
                  <RotateCwIcon />
                </Button>
                <Tooltip>
                  <p>Reset</p>
                </Tooltip>
              </TooltipTrigger>
            </CardAction>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            <MessageScrollerProvider>
              <MessageScroller key={demoKey}>
                <MessageScrollerViewport>
                  <MessageScrollerContent className="p-(--card-spacing)">
                    {items.map((item) =>
                      item.type === "message" ? (
                        <GroupChatMessage key={item.id} item={item} />
                      ) : (
                        <GroupChatMarker
                          key={item.id}
                          item={item}
                          scrollAnchor={item.scrollAnchor}
                        />
                      )
                    )}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 border-t">
            <Button
              type="button"
              isDisabled={isComplete}
              onPress={() =>
                setRockyTurn((turn) => (turn === "idle" ? "marker" : "message"))
              }
              className="w-full"
              variant="secondary"
            >
              {buttonLabel}
            </Button>
            <p className="text-xs text-muted-foreground">
              {rockyTurn === "idle"
                ? "This will create a marker and make it the anchor"
                : "Now send Rocky's reply into the conversation"}
            </p>
          </CardFooter>
        </Card>
        <div className="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-muted-foreground">
          When a user joins, a marker is created. scrollAnchor on the marker
          marks it as the next turn
        </div>
      </div>
    </MessageScrollerProvider>
  )
}

function GroupChatMessage({
  item,
}: {
  item: Extract<GroupChatItem, { type: "message" }>
}) {
  const isCurrentUser = item.sender === currentUser
  const variant = isCurrentUser
    ? "muted"
    : item.role === "assistant"
      ? "ghost"
      : "tinted"

  return (
    <MessageScrollerItem messageId={item.id} scrollAnchor={item.scrollAnchor}>
      <Message align={isCurrentUser ? "end" : "start"}>
        <MessageContent>
          {!isCurrentUser && <MessageHeader>{item.sender}</MessageHeader>}
          <Bubble variant={variant}>
            <BubbleContent>{item.text}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  )
}

function GroupChatMarker({
  item,
  scrollAnchor = false,
}: {
  item: Extract<GroupChatItem, { type: "event" }>
  scrollAnchor?: boolean
}) {
  return (
    <MessageScrollerItem scrollAnchor={scrollAnchor}>
      <Marker variant="separator">
        <MarkerContent>{item.text}</MarkerContent>
      </Marker>
    </MessageScrollerItem>
  )
}
```

### Keeping Context Visible

When a new turn starts, it should still feel like part of the same continuous
thread. `scrollPreviousItemPeek` keeps a slice of the previous item visible
above the anchor, so the reader keeps their context instead of feeling like the
conversation restarted on a blank page.

```tsx
// Keep 64px of the previous turn visible above the newly anchored row.
<MessageScrollerProvider scrollPreviousItemPeek={64}>
  <MessageScroller>{/* anchored turns */}</MessageScroller>
</MessageScrollerProvider>
```

Adjust the peek amount in the example below to see how it affects the conversation.

### Following the Live Edge

When the reader is at the live edge, either because they stayed there or
returned there, `autoScroll` keeps streamed replies in view as they grow.
Scrolling away from the live edge releases the view, whether by wheel, touch,
keyboard scroll keys, or dragging the scrollbar. An explicit message jump
releases it too. New chunks can then arrive without moving the reader.

```tsx
<MessageScrollerProvider autoScroll>
  <MessageScroller>{/* streamed turns */}</MessageScroller>
</MessageScrollerProvider>
```

Calling `scrollToEnd`, or pressing `MessageScrollerButton`, re-engages
follow-output when `autoScroll` is enabled, so a reader who scrolled away can
return to the live edge and keep following. The root and viewport expose
`data-autoscrolling` while that programmatic scroll to the latest message runs,
so you can conditionally apply styles during the transition.

### Opening Saved Threads

It can seem reasonable to reopen a saved thread at the absolute end of the
transcript, but that often drops the reader into the conversation without enough
context. A better default is `"last-anchor"`: show the last meaningful turn,
like the user's latest message, with the reply below it.

That gives the reader an immediate place in the thread. They can see what they
asked, where the answer starts, and continue from there without reconstructing
the conversation from the bottom edge.

```tsx
<MessageScrollerProvider defaultScrollPosition="last-anchor">
  <MessageScroller>{/* transcript */}</MessageScroller>
</MessageScrollerProvider>
```

**Example — `message-scroller-opening-position`**

```tsx
"use client"

import * as React from "react"

import { Bubble, BubbleContent } from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import { Message, MessageContent } from "@tecton/react/components/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from "@tecton/react/components/message-scroller"
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

const messages = [
  {
    id: "open-1",
    role: "user",
    text: "This is the first message the user sent in the conversation.",
  },
  {
    id: "open-2",
    role: "assistant",
    text: "Workspace creation rose 8%, but first invite completion only rose 2%.",
  },
  {
    id: "open-3",
    role: "user",
    text: "This is the last message the user sent in the conversation.",
  },
  {
    id: "open-4",
    role: "assistant",
    text: "Start with the invite step. Teams are creating workspaces but waiting to add collaborators.\n\nRecommended follow-up:\n\n1. Compare invite drop-off by account size.\n2. Check whether users who skip invites still return within 24 hours.\n3. Review the empty-state copy on the first project screen.\n4. Segment activation by template, since template users may not need invites right away.\n\nIf that pattern holds, the next experiment should make collaboration useful earlier instead of prompting for invites harder.",
  },
] satisfies Array<{
  id: string
  role: "user" | "assistant"
  text: string
}>

const positions = [
  { value: "start", label: "start" },
  { value: "end", label: "end" },
  { value: "last-anchor", label: "last-anchor" },
] satisfies Array<{
  value: "start" | "end" | "last-anchor"
  label: string
}>

export function MessageScrollerOpeningPosition() {
  const [positionKey, setPositionKey] = React.useState(0)
  const [position, setPosition] = React.useState<
    "start" | "end" | "last-anchor"
  >("last-anchor")

  return (
    <div className="relative flex flex-col gap-4">
      <Card className="mx-auto h-140 w-full max-w-sm gap-0">
        <CardHeader className="gap-1 border-b">
          <CardTitle>Opening Position</CardTitle>
          <CardDescription>
            Choose where a saved transcript opens.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <MessageScrollerProvider>
            <OpeningPositionScroller
              position={position}
              positionKey={positionKey}
            />
          </MessageScrollerProvider>
        </CardContent>
        <CardFooter className="flex items-center justify-center border-t">
          <Tabs
            selectedKey={position}
            onSelectionChange={(value) => {
              if (
                value === "start" ||
                value === "end" ||
                value === "last-anchor"
              ) {
                setPosition(value)
                setPositionKey((key) => key + 1)
              }
            }}
            className="w-full"
          >
            <TabsList className="w-full">
              {positions.map((option) => (
                <TabsTrigger key={option.value} id={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardFooter>
      </Card>
      <div className="mx-auto max-w-sm px-0.5 text-center text-xs text-muted-foreground">
        Toggle the defaultScrollPosition to see where the transcript starts when
        you open the thread
      </div>
    </div>
  )
}

function OpeningPositionScroller({
  position,
  positionKey,
}: {
  position: "start" | "end" | "last-anchor"
  positionKey: number
}) {
  const { scrollToEnd, scrollToMessage, scrollToStart } = useMessageScroller()

  React.useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (position === "start") {
        scrollToStart({ behavior: "auto" })
        return
      }

      if (position === "end") {
        scrollToEnd({ behavior: "auto" })
        return
      }

      scrollToMessage("open-3", {
        align: "start",
        behavior: "auto",
        scrollMargin: 64,
      })
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [position, positionKey, scrollToEnd, scrollToMessage, scrollToStart])

  return (
    <MessageScroller>
      <MessageScrollerViewport>
        <MessageScrollerContent className="p-(--card-spacing)">
          {messages.map((message) => {
            const isUserMessage = message.role === "user"

            return (
              <MessageScrollerItem
                key={message.id}
                messageId={message.id}
                scrollAnchor={isUserMessage}
              >
                <Message align={isUserMessage ? "end" : "start"}>
                  <MessageContent>
                    <Bubble variant={isUserMessage ? "muted" : "ghost"}>
                      <BubbleContent className="space-y-2">
                        {message.text
                          .split(/\n\s*\n/)
                          .map((paragraph) => paragraph.trim())
                          .filter(Boolean)
                          .map((paragraph, index) => (
                            <p key={index} className="whitespace-pre-wrap">
                              {paragraph}
                            </p>
                          ))}
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            )
          })}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  )
}
```

`"last-anchor"` is keyed on `scrollAnchor`, not message role. If no anchor
exists, or the last anchored turn already fits in the viewport, it falls back to
`"end"`.

Use `"start"` when you want to resume at the beginning of a conversation, or
`"end"` when the absolute latest message is the right place to land.

### Avoiding a Flash on Reload

A scroll container always opens at the top. HTML has no way to set `scrollTop`,
so a server-rendered transcript shows the oldest messages first. After
JavaScript runs, `defaultScrollPosition` moves the view, and you see a jump.

When `defaultScrollPosition` is `"end"` or `"last-anchor"`, the viewport has
`data-pending-scroll` until that position is applied. The styled viewport stays
hidden while the attribute is present, so you see the frame instead of the jump.
`"start"` does not need this.

If you want `"end"` visible on first paint, add an inline script right after the
viewport. Give the viewport an `id`, scroll it to the bottom, and remove
`data-pending-scroll`.

```tsx
const scrollToEndScript = `(function () {
  var viewport = document.getElementById("messages")
  if (!viewport) {
    return
  }
  viewport.scrollTop = viewport.scrollHeight
  viewport.removeAttribute("data-pending-scroll")
})()`

<MessageScroller>
  <MessageScrollerViewport id="messages" suppressHydrationWarning>
    <MessageScrollerContent>{/* transcript */}</MessageScrollerContent>
  </MessageScrollerViewport>
  <script dangerouslySetInnerHTML={{ __html: scrollToEndScript }} />
  <MessageScrollerButton />
</MessageScroller>
```

Put the script in your page, not in the scroller. It only works for `"end"`, and
only when the messages are already in the HTML. Add `suppressHydrationWarning` on
the viewport. If you use a Content Security Policy, pass a `nonce`.

Do not use this script with `"last-anchor"`. Skip it when messages load on the
client.

### Loading Earlier Messages

Loading earlier messages should not move the conversation the reader is already
looking at. When older rows are prepended above the current transcript,
`MessageScrollerViewport` preserves the visible row so the reader stays in the
same place while history loads above them.

This is enabled by default through `preserveScrollOnPrepend`.

Use stable `messageId` values for message rows. That gives the scroller a
specific row to preserve instead of guessing from whichever pixel happens to sit
at the viewport edge.

### Animating New Messages

`MessageScrollerItem` can be animated directly. Create a motion version of the
item, keep `messageId` and `scrollAnchor` on it, and use transform and opacity
for the entrance.

A common chat pattern is to animate the user's message when it is sent, then let
the assistant reply stream into a regular row below it. Start the user row below
its final position so it feels like it rises from the live edge of the viewport.

```tsx
const MotionMessageScrollerItem = motion.create(MessageScrollerItem)
```

Avoid animating height, margin, or padding for row entrances; those changes can
fight the scroller's positioning work. If the reader prefers reduced motion,
skip the entrance animation and keep the scroll behavior the same.

### Jumping to Messages

Search results, permalinks, outline items, and toolbar buttons often need to
drive the transcript from outside the message list. Use `useMessageScroller` for
those controls. Because the hooks read from `MessageScrollerProvider`, they work
in any component inside the provider, including controls rendered outside the
`MessageScroller` frame.

```tsx
import { useMessageScroller } from "@tecton/react/components/message-scroller"
```

```tsx
const { scrollToMessage, scrollToEnd, scrollToStart } = useMessageScroller()
```

`scrollToMessage` targets the `messageId` on `MessageScrollerItem`, so rows that
need to be addressable should have stable ids. `scrollToMessage` returns `false`
when the target is not mounted and cannot be queued.

`scrollToMessage` can queue a target before items exist, which covers
client-resolved permalinks while the transcript mounts. After rows have mounted,
a missing id returns `false` instead of starting a guessed retry loop. A `true`
result means the scroll ran or was queued, not that the row is already in view.

### Tracking the Reader's Position

Use `useMessageScrollerVisibility` to track the reader's position in the
conversation. A common example is a table-of-contents or a jump menu that
highlights the current anchored turn.

```tsx
import { useMessageScrollerVisibility } from "@tecton/react/components/message-scroller"
```

```tsx
const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility()
```

`currentAnchorId` answers "where am I" by reporting the current anchored turn,
and it stays set after that anchor scrolls above the viewport. `visibleMessageIds`
answers "what is on screen", in document order.

Visibility is pay-for-what-you-use. Tracking only runs while something
subscribes to `useMessageScrollerVisibility`, and rows need a `messageId` to
participate.

### Reading Scroll State

Use `useMessageScrollerScrollable` when you need scroll state in JavaScript, such
as a status indicator or a custom "jump to latest" control. It reports which
edges the viewport can still scroll toward; "at the start/end" is the negation
(`!start` / `!end`), and "scrollable at all" is `start || end`. For styling the
scroller itself, prefer the `data-scrollable` attribute.

```tsx
import { useMessageScrollerScrollable } from "@tecton/react/components/message-scroller"
```

```tsx
const { start, end } = useMessageScrollerScrollable()
```

## Performance

`MessageScroller` is benchmarked against large transcripts with markdown and
composed message rows.

Our performance goal for `MessageScroller` is to keep the scroll hot path outside of React state: no React rerenders for
transcript rows, no forced layout on every scroll, and as little off-screen paint
work as the browser can avoid.

Scroll position, anchoring, and follow-output are tracked imperatively and mirrored onto the root and viewport through `data-*` attributes, so scrolling and streaming do not rerender transcript rows.

The styled `MessageScrollerItem` also ships with `content-visibility: auto` and
`contain-intrinsic-size`. Rows stay in the DOM for selection, copy,
find-in-page, SSR, and assistive tech, but the browser can skip rendering work
for rows far outside the viewport.

Visibility tracking is pay-for-what-you-use. A jump menu or active
turn indicator costs nothing until something subscribes to
`useMessageScrollerVisibility`.

This is comfortable for the expected range of a chat transcript: hundreds to low
thousands of turns, including messages with markdown and composed components.

## Virtualization

Virtualization is intentionally left outside the primitive. `MessageScroller`
renders real DOM rows and stays fast well into the thousands of turns (see
[Performance](#performance)), so most transcripts never need it.

When a transcript is large enough to need virtualization, use
`MessageScrollerViewport` as the scroll element and let the virtualizer own the
rows.

```tsx showLineNumbers
import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"

function VirtualizedTranscript({
  messages,
}: {
  messages: Array<{ id: string; content: React.ReactNode }>
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 86,
    getItemKey: (index) => messages[index]?.id ?? index,
    overscan: 8,
  })

  return (
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport ref={viewportRef}>
          <MessageScrollerContent className="block min-h-full">
            <div
              className="relative w-full"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const message = messages[virtualItem.index]

                if (!message) {
                  return null
                }

                return (
                  <div
                    key={virtualItem.key}
                    ref={virtualizer.measureElement}
                    data-index={virtualItem.index}
                    className="absolute start-0 top-0 w-full"
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <Message>{message.content}</Message>
                  </div>
                )
              })}
            </div>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
```

## Accessibility

`MessageScroller` keeps the scroll container keyboard reachable and the
transcript announceable without forcing a specific message UI.

`MessageScrollerViewport` is a labelled, keyboard-focusable scroll region by
default. It uses `role="region"`, `aria-label="Messages"`, and `tabIndex={0}`,
so keyboard users can focus the transcript and scroll it directly.

`MessageScrollerContent` marks the transcript as a live region with
`role="log"` and `aria-relevant="additions"`. New rows can be announced, but
streamed text mutations do not have to be announced token by token.

```tsx
<MessageScrollerContent aria-busy={status === "streaming"}>
  {/* messages */}
</MessageScrollerContent>
```

Pass `aria-busy` while a turn streams if announcements should wait for the
completed message row.

`MessageScrollerButton` renders a real button. When there is nothing to scroll
toward, it sets `inert`, uses `tabIndex={-1}`, and exposes `data-active="false"`
so inactive scroll controls do not create extra focus stops.

## Unstyled

The behavior in `MessageScroller` comes from the `@shadcn/react` package. To use
it directly with your own markup and styles, see
[Message Scroller](https://ui.shadcn.com/docs/react/message-scroller) under @shadcn/react.

## API Reference

The props, data attributes, and hooks for every part are documented on the
[@shadcn/react Message Scroller](https://ui.shadcn.com/docs/react/message-scroller#api-reference) page.
They are identical for the styled component and the unstyled parts.
