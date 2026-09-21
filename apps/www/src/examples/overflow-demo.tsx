"use client"

import {
  AddIcon,
  ArchiveIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  LabelIcon,
  ShareIcon,
} from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  OverflowDivider,
  OverflowItem,
  OverflowLabel,
  Toolbar,
} from "@tecton/react/tecton/overflow"

export default function OverflowDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      {/* Drag the corner: the row collapses labels first, then moves items into the More menu. */}
      <div className="min-w-40 resize-x overflow-hidden rounded-md border p-2">
        <Toolbar aria-label="Well actions">
          <OverflowItem
            id="tag"
            label="Add tag"
            icon={<LabelIcon />}
            priority={2}
          >
            <Button variant="outline">
              <LabelIcon data-icon="inline-start" />
              <OverflowLabel>Add tag</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            id="share"
            label="Share"
            icon={<ShareIcon />}
            priority={1}
          >
            <Button variant="outline">
              <ShareIcon data-icon="inline-start" />
              <OverflowLabel>Share</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="copy" label="Duplicate" icon={<CopyIcon />}>
            <Button variant="outline">
              <CopyIcon data-icon="inline-start" />
              <OverflowLabel>Duplicate</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="export" label="Export" icon={<DownloadIcon />}>
            <Button variant="outline">
              <DownloadIcon data-icon="inline-start" />
              <OverflowLabel>Export</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem id="archive" label="Archive" icon={<ArchiveIcon />}>
            <Button variant="outline">
              <ArchiveIcon data-icon="inline-start" />
              <OverflowLabel>Archive</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowDivider />
          <OverflowItem
            id="delete"
            label="Delete"
            icon={<DeleteIcon />}
            variant="destructive"
            labelBehavior="keep"
          >
            <Button variant="destructive">
              <DeleteIcon data-icon="inline-start" />
              Delete
            </Button>
          </OverflowItem>
          {/* Unwrapped: the primary action never leaves the row. */}
          <Button>
            <AddIcon data-icon="inline-start" />
            New well
          </Button>
        </Toolbar>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the corner to resize.
      </p>
    </div>
  )
}
