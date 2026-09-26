---
component: Composer
module: "@tecton/react/tecton/composer"
family: conversation
exports: [Composer, ComposerField, ComposerInput, ComposerToolbar, ComposerSubmit, ComposerHint, ComposerStatusMessage, ComposerAttachments, ComposerSuggestions, ComposerSuggestion, ComposerCommands, useComposer]
notFor:
  - need: a one-line search or filter box
    use: InputGroup
  - need: a form field for a long description
    use: Textarea
  - need: a structured question with choices for the user to answer
    use: Questionnaire
related: [MessageScroller, Message, Attachment, Questionnaire]
---

## Use it when

- The user writes to an assistant or agent: the message box under a transcript.
- A reply streams back and the user must be able to stop it, and keep typing the next message meanwhile.
- The message carries something besides its text (a selection, a file) that the user can see and remove before sending.
- The user types slash commands (`/new`, `/summarise`) in the message box and picks one from a list.

## Do

- Pass the chat's `status` (`"ready" | "submitted" | "streaming" | "error"`) and `onStop`; `ComposerSubmit` swaps Send for Stop and Escape stops the reply.
- Keep `ComposerHint` (visible, or `visible={false}`) so the textarea is described by its keys, and `ComposerStatusMessage` for sent, stopped and failed.
- Pair it with a transcript whose `MessageScrollerContent` has `aria-busy` while a reply streams, so the reply is announced once, complete.
- Pass the prompts already sent as `history` (oldest first) for ArrowUp and ArrowDown, and use `submitMode="mod-enter"` for long-form input.
- Put extra context in `ComposerAttachments`, prompts to start from in `ComposerSuggestions`, slash commands in `ComposerCommands` inside `ComposerField`, and your own buttons (`InputGroupButton`, with or without a tooltip) straight into `ComposerToolbar` before `ComposerSubmit`.

## Don't

### HIGH Disabling the textarea while a reply streams

Wrong:

```tsx
<InputGroupTextarea disabled={status === "streaming"} value={text} onChange={(event) => setText(event.target.value)} />
```

Correct:

```tsx
<Composer status={status} onStop={stop} onSubmit={({ text }) => send(text)}>
  <ComposerField>
    <ComposerInput />
    <ComposerToolbar>
      <ComposerSubmit />
    </ComposerToolbar>
  </ComposerField>
</Composer>
```

A disabled textarea drops focus to the page body mid-reply and stops the user drafting; `Composer` keeps it enabled and simply does not send until the chat is ready.

### HIGH An Enter handler that ignores IME composition

Wrong:

```tsx
<InputGroupTextarea onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) send() }} />
```

Correct:

```tsx
<Composer onSubmit={({ text }) => send(text)}>
  <ComposerField>
    <ComposerInput />
  </ComposerField>
</Composer>
```

The Enter that confirms a Japanese or Chinese conversion arrives as a keydown too, and in Safari after `compositionend`, so the half-typed message is sent; `ComposerInput` ignores `isComposing` and key code 229.

### MEDIUM One send button whose label flips to Stop

Wrong:

```tsx
<InputGroupButton aria-label={busy ? "Stop" : "Send"} onClick={busy ? stop : send}>
  {busy ? <SquareIcon /> : <ArrowUpIcon />}
</InputGroupButton>
```

Correct:

```tsx
<ComposerToolbar>
  <ComposerSubmit />
</ComposerToolbar>
```

Screen readers do not reliably announce a name that changes under focus, and a click landing as the state flips stops a reply the user meant to send after; `ComposerSubmit` renders two named buttons and moves focus between them.
