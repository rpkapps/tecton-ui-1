# Bubble

Displays conversational content in a message bubble. Supports variants, alignment, grouping, reactions, and collapsible content.

Source: /docs/components/bubble.md

**Example — `bubble-demo`**

```tsx
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@tecton/react/components/bubble"

export function BubbleDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Bubble align="end">
        <BubbleContent>Hey there! what&apos;s up?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble variant="muted">
          <BubbleContent>Hey! Want to see chat bubbles?</BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>
            I can group messages, switch sides, and keep the whole thread easy
            to scan.
          </BubbleContent>
          <BubbleReactions role="img" aria-label="Reaction: thumbs up">
            <span>👍</span>
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
      <Bubble align="end">
        <BubbleContent>Sure. Hit me with your best demo.</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>
          Yes. You are reading a demo that is demoing itself. Very meta. Very
          on-brand.
        </BubbleContent>
        <BubbleReactions
          role="img"
          aria-label="Reactions: thumbs up, fire, eyes, and 2 more"
        >
          <span>👍</span>
          <span>🔥</span>
          <span>👀</span>
          <span>+2</span>
        </BubbleReactions>
      </Bubble>
    </div>
  )
}
```

The `Bubble` component displays framed conversational content. Use it for chat text, short structured output, quoted replies, suggestions, and reactions.

For full-featured chat interfaces, use the [`Message`](/docs/components/message.md) component. `Bubble` is intentionally scoped to the bubble surface. Place avatars, names, timestamps, metadata, and message-level actions in [`Message`](/docs/components/message.md).

## Usage

```tsx showLineNumbers
import { Bubble, BubbleContent, BubbleReactions } from "@tecton/react/components/bubble"
```

```tsx showLineNumbers
<Bubble>
  <BubbleContent>
    I checked the registry output and removed the stale route.
  </BubbleContent>
  <BubbleReactions>
    <span>👍</span>
  </BubbleReactions>
</Bubble>
```

## Composition

Use the following composition to build a bubble:

```text
Bubble
├── BubbleContent
└── BubbleReactions
```

Use `BubbleGroup` to group consecutive bubbles from the same sender:

```text
BubbleGroup
├── Bubble
│   └── BubbleContent
└── Bubble
    └── BubbleContent
```

## Features

- Seven visual variants, from a strong primary bubble to unframed ghost content
- Start and end alignment for sender and receiver bubbles
- Reactions that anchor to the bubble edge with configurable side and alignment
- Bubbles size to their content, up to 80% of the container width
- Polymorphic content via `render` for link and button bubbles
- Customizable styling through the `className` prop on every part

| Variant       | Description                                            |
| ------------- | ------------------------------------------------------ |
| `default`     | A strong primary bubble, usually for the current user. |
| `secondary`   | The standard neutral bubble for conversation content.  |
| `muted`       | A lower-emphasis bubble for quiet supporting content.  |
| `tinted`      | A subtle primary-tinted bubble.                        |
| `outline`     | A bordered bubble for secondary or rich content.       |
| `ghost`       | Unframed content for assistant text or rich content.   |
| `destructive` | A destructive bubble for error or failed actions.      |

A bubble sizes to its content, up to 80% of the container width. The `ghost` variant removes the max-width so assistant text and rich content can span the full row.

## Alignment

Use `align` on `Bubble` to align the bubble to the start or end of the conversation.

**Example — `bubble-alignment`**

```tsx
import { Bubble, BubbleContent } from "@tecton/react/components/bubble"

export function BubbleAlignmentDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Bubble variant="muted">
        <BubbleContent>
          This bubble is aligned to the start. This is the default alignment.
        </BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>
          This bubble is aligned to the end. Use this for user messages.
        </BubbleContent>
      </Bubble>
    </div>
  )
}
```

| align   | Description                                        |
| ------- | -------------------------------------------------- |
| `start` | Align the bubble to the start of the conversation. |
| `end`   | Align the bubble to the end of the conversation.   |

**Note:** When building chat interfaces, you probably want to use alignment on the `Message` component itself, not the `Bubble` component. You can use the `role` prop on the `Message` component to automatically align the bubble to the start or end of the conversation.

## Bubble Group

Use `BubbleGroup` to group consecutive bubbles from the same sender. Note the `align` prop should be set on the `Bubble` component itself, not the `BubbleGroup` component.

```text
BubbleGroup
├── Bubble
│   └── BubbleContent
└── Bubble
    └── BubbleContent
```

**Example — `bubble-group-demo`**

```tsx
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@tecton/react/components/bubble"

export function BubbleGroupDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Bubble variant="muted">
        <BubbleContent>Can you tell me what&apos;s the issue?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble align="end">
          <BubbleContent>You tell me!</BubbleContent>
        </Bubble>
        <Bubble align="end">
          <BubbleContent>It worked yesterday. You broke it!</BubbleContent>
        </Bubble>
        <Bubble align="end">
          <BubbleContent>Find the bug and fix it.</BubbleContent>
          <BubbleReactions aria-label="Reactions: eyes" align="start">
            <span>👀</span>
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
      <Bubble variant="muted">
        <BubbleContent>
          Want me to diff yesterday&apos;s you against today&apos;s you?
          It&apos;s a bit embarrassing.
        </BubbleContent>
      </Bubble>
    </div>
  )
}
```

## Links and Buttons

You can turn a bubble into a link or button by using the `render` prop on `BubbleContent`.

**Example — `bubble-link-button`**

```tsx
"use client"

import { toast } from "sonner"

import {
  Bubble,
  BubbleContent,
  BubbleGroup,
} from "@tecton/react/components/bubble"

export function BubbleLinkButtonDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Bubble variant="muted">
        <BubbleContent>How can I help you today?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={(props) => (
              <button
                onClick={() => toast("You clicked forgot password")}
                {...props}
              />
            )}
          >
            I forgot my password
          </BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={(props) => (
              <button
                onClick={() => toast("You clicked help with subscription")}
                {...props}
              />
            )}
          >
            I need help with my subscription
          </BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={(props) => (
              <button
                onClick={() =>
                  toast("You clicked something else. Talk to a human.")
                }
                {...props}
              />
            )}
          >
            Something else. Talk to a human.
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  )
}
```

```tsx showLineNumbers
import { Bubble, BubbleContent } from "@tecton/react/components/bubble"

export function BubbleLinkDemo() {
  return (
    <Bubble variant="muted">
      <BubbleContent render={(props) => <button {...props} type="button" />}>
        Click here
      </BubbleContent>
    </Bubble>
  )
}
```

## Reactions

Use `BubbleReactions` for bubble reactions. You can use it to display reactions or quick action buttons. Use `side` and `align` to position the row — `side="top"` anchors it to the upper edge. Reactions overlap the bubble edge, so leave vertical space between rows — the examples below use a larger `gap` for this reason.

**Example — `bubble-reactions`**

```tsx
"use client"

import { toast } from "sonner"

import {
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"

export function BubbleReactionsDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-12 py-12">
      <Bubble variant="muted" align="end">
        <BubbleContent>
          I don&apos;t need tests, I know my code works.
        </BubbleContent>
        <BubbleReactions
          align="start"
          role="img"
          aria-label="Reactions: thumbs up, surprised"
        >
          <span>👍</span>
          <span>😮</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>
          Bold. Fine I&apos;ll add some tests. I&apos;ll let you know when
          they&apos;re done.
        </BubbleContent>
        <BubbleReactions
          role="img"
          aria-label="Reactions: eyes, rocket, and 2 more"
        >
          <span>👀</span>
          <span>🚀</span>
          <span>+2</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="default" align="end">
        <BubbleContent>
          Tests passed on the first try. All 142 of them. Looking good!
        </BubbleContent>
        <BubbleReactions
          side="top"
          align="start"
          role="img"
          aria-label="Reactions: party popper, clapping hands"
        >
          <span>🎉</span>
          <span>👏</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="destructive">
        <BubbleContent>Are you sure I can run this command?</BubbleContent>
        <BubbleReactions>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => toast.success("You clicked yes, running command...")}
          >
            Yes, run it
          </Button>
        </BubbleReactions>
      </Bubble>
    </div>
  )
}
```

## Show More / Collapsible

Long bubble content can be composed with [`Collapsible`](/docs/components/collapsible.md) to allow for a show more or show less interaction. Use the `CollapsibleTrigger` component to trigger the collapsible content.

**Example — `bubble-collapsible`**

```tsx
"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Bubble, BubbleContent } from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"
import { Collapsible } from "@tecton/react/components/collapsible"

const text = `The accessibility review found two focus states that were visually too subtle in dark mode.

I checked the dialog, menu, and drawer paths because each one renders focusable controls inside a layered surface.

The dialog and drawer are fine. The menu needs the hover and focus tokens split so keyboard focus stays visible when the pointer is not involved.

I also recommend keeping the change in the style file instead of the primitive so the other themes can choose their own focus treatment later.`

const previewLength = 180

export function BubbleCollapsible() {
  const [open, setOpen] = React.useState(false)
  const isLong = text.length > previewLength
  const preview = `${text.slice(0, previewLength)}...`

  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Bubble variant="muted">
        <BubbleContent>How can I help you today?</BubbleContent>
      </Bubble>

      <Bubble variant="muted" align="end">
        <BubbleContent className="whitespace-pre-line">
          <Collapsible isExpanded={open} onExpandedChange={setOpen}>
            <div>{open || !isLong ? text : preview}</div>
            {isLong ? (
              <Button
                slot="trigger"
                variant="link"
                className="gap-1 p-0 text-muted-foreground"
              >
                {open ? "Show less" : "Show more"}
                <ChevronDownIcon
                  data-icon="inline-end"
                  className="group-data-panel-open/button:rotate-180"
                />
              </Button>
            ) : null}
          </Collapsible>
        </BubbleContent>
      </Bubble>
    </div>
  )
}
```

## Tooltip

Wrap a bubble in a [`Tooltip`](/docs/components/tooltip.md) to reveal metadata on hover, such as when a message was read.

**Example — `bubble-tooltip`**

```tsx
import { CheckIcon } from "lucide-react"

import {
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function BubbleTooltipDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 py-12">
      <Bubble variant="secondary">
        <BubbleContent>Did you remove the stale route?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Yes, removed it from the registry.</BubbleContent>
        <BubbleReactions>
          <TooltipTrigger>
            <Button variant="ghost" size="icon-xs">
              <CheckIcon />
            </Button>
            <Tooltip>Read on Jan 5, 2026 at 4:32 PM</Tooltip>
          </TooltipTrigger>
        </BubbleReactions>
      </Bubble>
    </div>
  )
}
```

## Popover

Pair a bubble with a [`Popover`](/docs/components/popover.md) to surface more information on demand, such as the full error message for a failed action.

**Example — `bubble-popover`**

```tsx
import { InfoIcon } from "lucide-react"

import {
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"

export function BubblePopoverDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 py-12">
      <Bubble align="end">
        <BubbleContent>Run the build script.</BubbleContent>
      </Bubble>
      <Bubble variant="destructive">
        <BubbleContent>Failed to run the command.</BubbleContent>
        <BubbleReactions>
          <PopoverTrigger>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Show error details"
              className="aria-expanded:text-destructive"
            >
              <InfoIcon />
            </Button>
            <Popover>
              <PopoverHeader>
                <PopoverTitle className="text-sm">
                  Command failed with exit code 1
                </PopoverTitle>
                <PopoverDescription className="text-sm">
                  ENOENT: no such file or directory, open pnpm-lock.yaml
                </PopoverDescription>
              </PopoverHeader>
            </Popover>
          </PopoverTrigger>
        </BubbleReactions>
      </Bubble>
    </div>
  )
}
```

## Accessibility

`Bubble` renders the presentational message surface. Keep conversation-level semantics on the surrounding container and follow the guidelines below.

### Labeling Reactions

Reactions render as a row of emoji. A screen reader reads each glyph with no context, and counters like `+8` are announced as "plus eight". Group the row as a single image with a descriptive `aria-label` so it announces once. `role="img"` also hides the individual emoji from assistive tech, so no `aria-hidden` is needed.

```tsx showLineNumbers
<BubbleReactions role="img" aria-label="Reactions: thumbs up, fire, and 8 more">
  <span>👍</span>
  <span>🔥</span>
  <span>+8</span>
</BubbleReactions>
```

When reactions are interactive, render buttons instead and give icon-only buttons an `aria-label`.

```tsx showLineNumbers
<BubbleReactions>
  <Button aria-label="Thumbs up" variant="secondary" size="icon-xs">
    <ThumbsUpIcon />
  </Button>
</BubbleReactions>
```

### Interactive Bubbles

When a bubble is clickable, render it as a real `<button>` or `<a>` with the `render` prop so it is focusable and exposes the correct role. `BubbleContent` ships a visible focus ring for interactive elements, and the accessible name comes from the bubble text. No extra label is needed.

```tsx showLineNumbers
<Bubble variant="muted" align="end">
  <BubbleContent
    render={(props) => <button {...props} type="button" onClick={onReply} />}
  >
    I forgot my password
  </BubbleContent>
</Bubble>
```

### Meaning Beyond Color

Bubble variants signal role and tone with color. Pair them with text, alignment, or icons so meaning is not conveyed by color alone. For a `destructive` bubble, keep the error context in the message text rather than relying on the color treatment.

## API Reference

### Bubble

The root bubble wrapper.

| Prop        | Type                                                                                       | Default     | Description                                      |
| ----------- | ------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------ |
| `variant`   | `"default" \| "secondary" \| "muted" \| "tinted" \| "outline" \| "ghost" \| "destructive"` | `"default"` | The bubble visual treatment.                     |
| `align`     | `"start" \| "end"`                                                                         | `"start"`   | The inline alignment of the bubble.              |
| `className` | `string`                                                                                   | -           | Additional classes to apply to the root element. |

### BubbleContent

The bubble content wrapper.

| Prop        | Type                       | Default | Description                                               |
| ----------- | -------------------------- | ------- | --------------------------------------------------------- |
| `render`    | `ReactElement \| function` | -       | Render the content as a different element such as a link. |
| `className` | `string`                   | -       | Additional classes to apply to the content element.       |

### BubbleReactions

Displays overlapped reactions for a bubble.

| Prop        | Type                | Default    | Description                                      |
| ----------- | ------------------- | ---------- | ------------------------------------------------ |
| `side`      | `"top" \| "bottom"` | `"bottom"` | The side of the bubble to anchor the reactions.  |
| `align`     | `"start" \| "end"`  | `"end"`    | The inline alignment of the reactions.           |
| `className` | `string`            | -          | Additional classes to apply to the reaction row. |

### BubbleGroup

Groups consecutive bubbles from the same sender.

| Prop        | Type     | Default | Description                                    |
| ----------- | -------- | ------- | ---------------------------------------------- |
| `className` | `string` | -       | Additional classes to apply to the group root. |
