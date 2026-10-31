---
component: Dropzone
module: "@tecton/react/tecton/dropzone"
family: forms
exports: [Dropzone, DropzoneArea, DropzoneTrigger, DropzoneList, DropzoneRemove, useDropzone, formatFileSize]
notFor:
  - need: showing a file that is already attached, with no picking
    use: Attachment
  - need: attaching files to a chat message
    use: Composer
  - need: a plain one-line text or number entry
    use: Input
related: [Attachment, Empty, Field]
---

## Use it when

- The user uploads files by dragging them from the desktop, or picks them with a browse button.
- The picked files are listed before or while they upload, each with a remove button.
- The files must match a type, a size or a count, and refused ones need a reason.

## Do

- Compose `Dropzone > DropzoneArea` with the `Empty` parts inside it and a `DropzoneTrigger` in `EmptyContent`, then `DropzoneList` with one `Attachment` per file.
- Keep the files with `value` / `onValueChange` (or `defaultValue`), and limit them with `accept`, `maxSize`, `maxFiles` and `multiple={false}`.
- Show refused files from `onFileReject`: each rejection has a `reason` and a ready `message` for a `FieldError` or a toast.
- Drive each card's upload with `Attachment state` (`uploading`, `error`, `done`) and put `DropzoneRemove` in its `AttachmentActions`; print sizes with `formatFileSize`.

## Don't

### HIGH A hand-built drop div

Wrong:

```tsx
<div onDragOver={(e) => e.preventDefault()} onDrop={(e) => setFiles([...e.dataTransfer.files])}>Drop files here</div>
```

Correct:

```tsx
<Dropzone value={files} onValueChange={setFiles} accept=".las,.csv">
  <DropzoneArea>
    <EmptyTitle>Drop well logs here</EmptyTitle>
    <DropzoneTrigger>Browse files</DropzoneTrigger>
  </DropzoneArea>
</Dropzone>
```

The div has no keyboard way in, checks no type or size, keeps no drag highlight across its children and announces nothing; `DropzoneArea` does all of that and `DropzoneTrigger` is the button keyboard users need.

### HIGH Leaving out the DropzoneTrigger

Wrong:

```tsx
<DropzoneArea>
  <EmptyTitle>Drop files or click to browse</EmptyTitle>
</DropzoneArea>
```

Correct:

```tsx
<DropzoneArea>
  <EmptyTitle>Drop files here</EmptyTitle>
  <DropzoneTrigger>Browse files</DropzoneTrigger>
</DropzoneArea>
```

A click on the area opens the picker for the mouse only: the area is not focusable, so without the trigger a keyboard or screen reader user cannot add a file at all.

### MEDIUM Picked files as Badges

Wrong:

```tsx
{files.map((file) => <Badge key={file.name}>{file.name}</Badge>)}
```

Correct:

```tsx
<DropzoneList>
  {files.map((file) => (
    <Attachment key={file.name} className="w-full">
      <AttachmentContent>
        <AttachmentTitle>{file.name}</AttachmentTitle>
        <AttachmentDescription>{formatFileSize(file.size)}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <DropzoneRemove file={file} />
      </AttachmentActions>
    </Attachment>
  ))}
</DropzoneList>
```

A `Badge` has no slot for the size, no upload `state` and no remove action; `DropzoneRemove` is labelled with "Remove" and the file name, and moves focus on to the next file.
