"use client"

import * as React from "react"
import {
  FileTextIcon,
  FileWarningIcon,
  RefreshCwIcon,
  UploadIcon,
} from "lucide-react"

import {
  Attachment,
  AttachmentAction,
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
import { Spinner } from "@tecton/react/components/spinner"
import {
  Dropzone,
  DropzoneArea,
  DropzoneList,
  DropzoneRemove,
  DropzoneTrigger,
  formatFileSize,
} from "@tecton/react/tecton/dropzone"

type Upload = { progress: number; failed: boolean }

/**
 * A pretend upload: each file climbs to 100 % in a few seconds, and a file
 * whose name contains "fail" stops halfway, so the retry can be tried.
 */
function useFakeUploads(files: File[]) {
  const [uploads, setUploads] = React.useState(() => new Map<File, Upload>())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setUploads((current) => {
        const next = new Map<File, Upload>()
        for (const file of files) {
          const upload = current.get(file) ?? { progress: 0, failed: false }
          const failing = file.name.includes("fail") && upload.progress >= 50
          next.set(
            file,
            upload.failed || upload.progress >= 100
              ? upload
              : failing
                ? { ...upload, failed: true }
                : { ...upload, progress: Math.min(100, upload.progress + 8) }
          )
        }
        return next
      })
    }, 200)
    return () => clearInterval(timer)
  }, [files])

  const retry = (file: File) =>
    setUploads((current) =>
      new Map(current).set(file, { progress: 0, failed: false })
    )

  return { uploads, retry }
}

export default function DropzoneUpload() {
  const [files, setFiles] = React.useState<File[]>([])
  const { uploads, retry } = useFakeUploads(files)

  return (
    <Dropzone value={files} onValueChange={setFiles} className="max-w-md">
      <DropzoneArea className="p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UploadIcon />
          </EmptyMedia>
          <EmptyTitle>Upload survey reports</EmptyTitle>
          <EmptyDescription>
            Drop files here. A file named “fail” shows a failed upload.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <DropzoneTrigger>Browse files</DropzoneTrigger>
        </EmptyContent>
      </DropzoneArea>
      <DropzoneList>
        {files.map((file) => {
          const upload = uploads.get(file) ?? { progress: 0, failed: false }
          const done = upload.progress >= 100
          const state = upload.failed ? "error" : done ? "done" : "uploading"
          return (
            <Attachment
              key={`${file.name}-${file.lastModified}`}
              state={state}
              className="w-full"
            >
              <AttachmentMedia>
                {state === "uploading" ? (
                  <Spinner />
                ) : state === "error" ? (
                  <FileWarningIcon />
                ) : (
                  <FileTextIcon />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{file.name}</AttachmentTitle>
                <AttachmentDescription>
                  {state === "uploading"
                    ? `Uploading · ${upload.progress}%`
                    : state === "error"
                      ? "Upload failed. Try again."
                      : `Uploaded · ${formatFileSize(file.size)}`}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                {state === "error" && (
                  <AttachmentAction
                    aria-label={`Retry ${file.name}`}
                    onClick={() => retry(file)}
                  >
                    <RefreshCwIcon />
                  </AttachmentAction>
                )}
                <DropzoneRemove file={file} />
              </AttachmentActions>
            </Attachment>
          )
        })}
      </DropzoneList>
    </Dropzone>
  )
}
