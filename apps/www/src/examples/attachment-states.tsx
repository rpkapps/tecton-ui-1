// Synced from shadcn/ui (apps/v4/examples/aria/attachment-states.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { CheckIcon, CloseIcon, DescriptionIcon, ScheduleIcon, SyncIcon, WarningIcon } from "@tecton/react/icons"

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@tecton/react/components/attachment"
import { Spinner } from "@tecton/react/components/spinner"

export function AttachmentStates() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-2 py-12">
      <Attachment state="idle" className="w-full">
        <AttachmentMedia>
          <ScheduleIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>selected-file.pdf</AttachmentTitle>
          <AttachmentDescription>Ready to upload</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove selected-file.pdf">
            <CloseIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment state="uploading" className="w-full">
        <AttachmentMedia>
          <Spinner />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>design-system.zip</AttachmentTitle>
          <AttachmentDescription>Uploading · 64%</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Cancel upload">
            <CloseIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment state="processing" className="w-full">
        <AttachmentMedia>
          <DescriptionIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>market-research.pdf</AttachmentTitle>
          <AttachmentDescription>Processing document</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove market-research.pdf">
            <CloseIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment state="error" className="w-full">
        <AttachmentMedia>
          <WarningIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
          <AttachmentDescription>
            Upload failed. Try again.
          </AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Retry upload">
            <SyncIcon />
          </AttachmentAction>
          <AttachmentAction aria-label="Remove financial-model.xlsx">
            <CloseIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
      <Attachment state="done" className="w-full">
        <AttachmentMedia>
          <CheckIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>uploaded-report.pdf</AttachmentTitle>
          <AttachmentDescription>Uploaded · 1.8 MB</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove uploaded-report.pdf">
            <CloseIcon />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    </div>
  )
}
