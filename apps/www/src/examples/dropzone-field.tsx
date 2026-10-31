"use client"

import * as React from "react"
import { FileSpreadsheetIcon, UploadIcon } from "lucide-react"

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
  Field,
  FieldDescription,
  FieldError,
  FieldTitle,
} from "@tecton/react/components/field"
import {
  Dropzone,
  DropzoneArea,
  DropzoneList,
  DropzoneRemove,
  DropzoneTrigger,
  formatFileSize,
  type DropzoneFileRejection,
} from "@tecton/react/tecton/dropzone"

export default function DropzoneField() {
  const [files, setFiles] = React.useState<File[]>([])
  const [rejections, setRejections] = React.useState<DropzoneFileRejection[]>(
    []
  )
  const invalid = rejections.length > 0

  return (
    <Field data-invalid={invalid || undefined} className="max-w-md">
      <FieldTitle>Well logs</FieldTitle>
      <FieldDescription id="well-logs-description">
        LAS or CSV files, up to three.
      </FieldDescription>
      <Dropzone
        value={files}
        onValueChange={(next) => {
          setFiles(next)
          setRejections([])
        }}
        onFileReject={setRejections}
        accept=".las,.csv"
        maxFiles={3}
        name="wellLogs"
      >
        <DropzoneArea aria-invalid={invalid || undefined} className="p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UploadIcon />
            </EmptyMedia>
            <EmptyTitle>Drop well logs here</EmptyTitle>
            <EmptyDescription>
              Or pick them from your computer.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <DropzoneTrigger size="sm" aria-describedby="well-logs-description">
              Browse files
            </DropzoneTrigger>
          </EmptyContent>
        </DropzoneArea>
        <DropzoneList>
          {files.map((file) => (
            <Attachment key={file.name} size="sm" className="w-full">
              <AttachmentMedia>
                <FileSpreadsheetIcon />
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
      <FieldError errors={rejections} />
    </Field>
  )
}
