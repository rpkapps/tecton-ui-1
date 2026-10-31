"use client"

import * as React from "react"
import { ImageIcon } from "lucide-react"

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

/** An object URL for the picked image, revoked when it changes. */
function usePreview(file: File | undefined) {
  const [url, setUrl] = React.useState<string>()
  React.useEffect(() => {
    if (!file) return setUrl(undefined)
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

export default function DropzoneSingle() {
  const [files, setFiles] = React.useState<File[]>([])
  const photo = files.at(0)
  const preview = usePreview(photo)

  return (
    <Dropzone
      value={files}
      onValueChange={setFiles}
      multiple={false}
      accept="image/*"
      className="max-w-sm"
    >
      <DropzoneArea className="gap-3 p-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle className="text-base">Core sample photo</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <DropzoneTrigger size="sm">
            {photo ? "Replace photo" : "Choose photo"}
          </DropzoneTrigger>
        </EmptyContent>
      </DropzoneArea>
      <DropzoneList>
        {photo && (
          <Attachment orientation="vertical" className="w-40">
            <AttachmentMedia variant="image">
              {preview && <img src={preview} alt="" />}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{photo.name}</AttachmentTitle>
              <AttachmentDescription>
                {formatFileSize(photo.size)}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <DropzoneRemove file={photo} variant="secondary" />
            </AttachmentActions>
          </Attachment>
        )}
      </DropzoneList>
    </Dropzone>
  )
}
