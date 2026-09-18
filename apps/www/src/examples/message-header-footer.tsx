// Synced from shadcn/ui (apps/v4/examples/aria/message-header-footer.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Bubble, BubbleContent } from "@tecton/react/components/bubble"
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@tecton/react/components/message"

export function MessageHeaderFooterDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Message>
        <MessageContent>
          <MessageHeader>Olivia</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>I already checked the logs.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>
              Send the report to the team. Ping @casey if you need help.
            </BubbleContent>
          </Bubble>
          <MessageFooter>
            <div>
              Read <span className="font-normal">Yesterday</span>
            </div>
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  )
}
