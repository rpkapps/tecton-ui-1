"use client"

import * as React from "react"
import { FileTextIcon, ImageIcon, UploadIcon } from "lucide-react"

import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@tecton/react/components/attachment"
import {
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"
import {
  Dropzone,
  DropzoneArea,
  DropzoneList,
  DropzoneRemove,
  DropzoneTrigger,
  formatFileSize,
} from "@tecton/react/tecton/dropzone"

export default function DropzoneDemo() {
  const [files, setFiles] = React.useState<File[]>([])

  return (
    <Dropzone
      value={files}
      onValueChange={setFiles}
      accept="image/*,.pdf"
      maxSize={10 * 1024 * 1024}
      className="max-w-md"
    >
      <DropzoneArea>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UploadIcon />
          </EmptyMedia>
          <EmptyTitle>Drop files here</EmptyTitle>
          <EmptyDescription>Images or PDF, up to 10 MB each.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <DropzoneTrigger>Browse files</DropzoneTrigger>
        </EmptyContent>
      </DropzoneArea>
      <DropzoneList>
        {files.map((file) => (
          <Attachment
            key={`${file.name}-${file.lastModified}`}
            className="w-full"
          >
            <AttachmentMedia>
              {file.type.startsWith("image/") ? (
                <ImageIcon />
              ) : (
                <FileTextIcon />
              )}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.name}</AttachmentTitle>
              <AttachmentDescription>
                {formatFileSize(file.size)}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <DropzoneRemove file={file} />
            </AttachmentActions>
          </Attachment>
        ))}
      </DropzoneList>
    </Dropzone>
  )
}
