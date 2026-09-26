---
component: Attachment
module: "@tecton/react/components/attachment"
family: conversation
exports: [Attachment, AttachmentGroup, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction, AttachmentTrigger]
notFor:
  - need: a short static label such as a file type or a count
    use: Badge
  - need: a tag the user can select or remove from a filter row
    use: Chip
  - need: a row of a file browser or a settings list
    use: Item
related: [Message, Badge, Item]
---

## Use it when

- A file or an image the user attached: in the composer before sending, or inside a message.
- The upload lifecycle has to be visible: selected, uploading, processing, failed, done.
- The card opens something — a preview dialog, a download — while remove or retry stays separate.

## Do

- Compose it: `AttachmentMedia`, then `AttachmentContent` with `AttachmentTitle` and `AttachmentDescription`, then `AttachmentActions`.
- Drive the look with `state="idle" | "uploading" | "processing" | "error" | "done"`, `size` and `orientation`.
- Use `AttachmentMedia variant="image"` around an `<img>` and `orientation="vertical"` for a thumbnail; lay several cards out in an `AttachmentGroup`.
- Give every `AttachmentAction` an `aria-label` naming the action and the file; it is a `Button`, so press it with `onClick`.

## Don't

### HIGH A file rendered as a Badge with a paperclip

Wrong:

```tsx
<Badge variant="info">
  <PaperclipIcon data-icon="inline-start" /> sales-dashboard.pdf
</Badge>
```

Correct:

```tsx
<Attachment size="sm">
  <AttachmentMedia>
    <FileTextIcon />
  </AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
    <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
  </AttachmentContent>
</Attachment>
```

`Badge` is a one-line `span` with a single text slot: the name gets none of `AttachmentTitle`'s `truncate`, the size and the upload status have nowhere to go, and there is no `state` axis to move the card through.

### HIGH Hand-painting the failed upload

Wrong:

```tsx
<Attachment className="border-red-500 text-red-600">
  <AttachmentContent>
    <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
  </AttachmentContent>
</Attachment>
```

Correct:

```tsx
<Attachment state="error">
  <AttachmentContent>
    <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
    <AttachmentDescription>Upload failed. Try again.</AttachmentDescription>
  </AttachmentContent>
</Attachment>
```

`state` writes `data-state` on the root, and the border, the media tint and the description colour are `data-[state=error]` and `group-data-[state=error]/attachment:` rules, while `border-red-500` is stock Tailwind and emits no CSS at all.

### MEDIUM Opening the preview from the card's onClick

Wrong:

```tsx
<Attachment onClick={() => setPreviewOpen(true)}>{card}</Attachment>
```

Correct:

```tsx
<Attachment>
  {card}
  <AttachmentTrigger aria-label="Preview workspace.png" onClick={() => setPreviewOpen(true)} />
</Attachment>
```

The root is a `div`, so the handler is mouse-only; `AttachmentTrigger` is a real `button` whose `absolute inset-0 z-10` covers the card but stays under `AttachmentActions` at `z-20`, so remove and retry keep working.
