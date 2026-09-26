import { DownloadIcon, PlusIcon, SettingsIcon, ShareIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { OverflowItem, OverflowLabel } from "@tecton/react/tecton/overflow"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

export default function PageHeaderActionsExample() {
  return (
    <div className="w-full max-w-2xl min-w-64 resize-x overflow-hidden rounded-md border p-4">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Wells</PageHeaderTitle>
          <PageHeaderDescription>
            23 wells across 4 fields.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          {/* Secondary actions collapse into the More menu when the header is narrow. */}
          <OverflowItem
            value="settings"
            label="Settings"
            icon={<SettingsIcon />}
          >
            <Button variant="ghost">
              <SettingsIcon data-icon="inline-start" />
              <OverflowLabel>Settings</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            value="export"
            label="Export"
            icon={<DownloadIcon />}
            priority={1}
          >
            <Button variant="outline">
              <DownloadIcon data-icon="inline-start" />
              <OverflowLabel>Export</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            value="share"
            label="Share"
            icon={<ShareIcon />}
            priority={2}
          >
            <Button variant="outline">
              <ShareIcon data-icon="inline-start" />
              <OverflowLabel>Share</OverflowLabel>
            </Button>
          </OverflowItem>
          {/* Unwrapped: the primary action never leaves the row. */}
          <Button>
            <PlusIcon data-icon="inline-start" />
            New well
          </Button>
        </PageHeaderActions>
      </PageHeader>
    </div>
  )
}
