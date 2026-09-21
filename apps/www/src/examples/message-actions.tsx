// Synced from shadcn/ui (apps/v4/examples/aria/message-actions.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { CopyIcon, SyncIcon, ThumbDownIcon, ThumbUpIcon } from "@tecton/react/icons"

import { Bubble, BubbleContent } from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@tecton/react/components/message"

export function MessageActionsDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Message>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>
              The install failure is coming from the workspace package.
            </BubbleContent>
          </Bubble>
          <MessageFooter>
            <Button variant="ghost" size="icon" aria-label="Copy">
              <CopyIcon />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Like">
              <ThumbUpIcon />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Dislike">
              <ThumbDownIcon />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>Okay drop me a link. Taking a look...</BubbleContent>
          </Bubble>
          <MessageFooter className="gap-2">
            <span className="font-normal text-destructive">Failed to send</span>
            <Button variant="ghost" size="icon-xs" aria-label="Retry">
              <SyncIcon />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  )
}
