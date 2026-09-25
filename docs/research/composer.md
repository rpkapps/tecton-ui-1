# Chat composer research (Tecton, React Aria base)

Date: 2026-09-25. Upstream checked: `shadcn-ui/ui` main @ `98a1fe67` (2026-09-21), shallow clone.
Network note: most doc sites (elements.ai-sdk.dev, assistant-ui.com, code.visualstudio.com, w3.org,
vendor help centres) were blocked by the egress proxy. AI Elements, assistant-ui, CopilotKit and
VS Code docs were read **from source** (git clones). The other products come from web search
summaries; claims that rest only on third-party cheat sheets are marked *(3rd-party)*.

---

## 1. Upstream shadcn/ui: is there a composer?

**No.** There is no composer / prompt-input / chat-input / message-input item in any base or in the
published registry.

| Where | Finding |
|---|---|
| `apps/v4/registry/bases/aria/ui/` (61 files) | Chat items: `message`, `bubble`, `message-scroller`, `marker`, `attachment`, `questionnaire`, plus `input-group`, `textarea`, `kbd`. Nothing named composer/prompt/chat-input. |
| `apps/v4/registry/bases/radix/ui/` | Same set (+ `menubar`, `navigation-menu`). No composer. |
| `apps/v4/public/r/index.json` (63 items) | Chat-ish names: `attachment bubble input input-group input-otp marker message message-scroller questionnaire`. No composer. |
| `apps/v4/content/docs/changelog/2026-06-chat-components.mdx` | "This is the **first phase** of the chat components work… We are starting with the **conversation layer**: scrolling, message rows, bubbles, attachments, and markers." Also: "This does not replace AI Elements." |
| `packages/react/src/` (`@shadcn/react`, headless) | Only `message-scroller`, `questionnaire`, `use-render`. No composer primitive. |
| `apps/v4/content/docs/components/aria/attachment.mdx` | Only mention of the word: Attachment is "for files and images in chat composers". |

### The one "prompt input" in the repo (not a registry item)

`apps/v4/registry/bases/radix/blocks/preview-03/components/prompt-input.tsx` (227 lines, **Radix
only**). It is an internal file of the unfinished `preview-03` block: the `preview-03` entries in
`radix/blocks/_registry.ts` and `aria/blocks/_registry.ts` list only `blocks/preview-03/index.tsx`,
and the aria/base `index.tsx` is a placeholder (`<div>Preview 03</div>`). Used by
`preview-03/cards/{simple,files,group,reasoning,sources,tool}-chat.tsx`.

```tsx
PromptInput({ onSubmit(input: string), status: ChatStatus /* from "ai" */, className?, defaultValue? })
// <form onSubmit> > FieldGroup > InputGroup >
//   InputGroupTextarea (controlled, "h-10 min-h-10 overflow-y-auto")
//   InputGroupAddon align="block-end":
//     DropdownMenu "+" (sr-only "Add": Add Photos and Files, Screenshot, Create Image,
//                       Deep Research, Web Search, More > Agent Mode…)
//     InputGroupButton type=submit (sr-only "Send"), disabled={isBusy || !value.trim()}
//     InputGroupButton type=button (sr-only "Stop"), shown via data-visible while streaming
```

Keyboard: **none**. No `onKeyDown`, so Enter inserts a newline and the only way to send is the
button; the Stop button has no handler; Send uses native `disabled` (drops out of tab order).

### How upstream's chat examples build the input

All use plain `form` + `InputGroup` + `InputGroupButton`; none handles keys.

| File | Input | Keyboard |
|---|---|---|
| `apps/v4/examples/aria/message-scroller-demo.tsx` (also `-streaming`, `-previous-context`) | `<form onSubmit>` > `InputGroup` > a **non-editable `<div>`** showing the next scripted message ("Demo is read only. Press send") + `DropdownMenuTrigger` `InputGroupButton aria-label="Add files"` + submit `InputGroupButton isDisabled={!next || isBusy}` with sr-only "Send". | Submit button only. |
| `apps/v4/registry/bases/aria/examples/message-scroller-example.tsx` | `InputGroupTextarea readOnly` + Send (`type=submit`, `isDisabled`) and Stop (`type=button`, **`onClick={() => stop()}`**, not `onPress`) toggled with `data-hidden`. | None. |
| `apps/v4/examples/base/ai-sdk-helper-demo.tsx`, `tanstack-ai-helper-demo.tsx` | `InputGroupTextarea readOnly aria-label="Next predefined message"`. | None. |

Transcript a11y that upstream *does* ship (relevant to the composer contract),
`content/docs/components/aria/message-scroller.mdx` §Accessibility:
`MessageScrollerViewport` = `role="region" aria-label="Messages" tabIndex={0}`;
`MessageScrollerContent` = `role="log" aria-relevant="additions"`, and the docs recommend
`aria-busy={status === "streaming"}` so the finished row is announced instead of token mutations;
`MessageScrollerButton` goes `inert` + `tabIndex=-1` when inactive.

**Implication for Tecton:** a Composer is Tecton-specific behaviour → `packages/tecton-react/src/tecton/composer.tsx`,
composed from the generated `input-group`/`textarea`/`button`/`attachment`/`kbd`. It does not
duplicate a shadcn component today. If upstream ships one later (phase 2), re-evaluate.

---

## 2. Survey of composers

### Vercel AI Elements `PromptInput` — source: `github.com/vercel/ai-elements` `packages/elements/src/prompt-input.tsx` (1463 lines); docs https://elements.ai-sdk.dev/components/prompt-input
- Parts: `PromptInput` (form; `accept`, `multiple`, `globalDrop`, `maxFiles`, `maxFileSize`, `onError{code: max_files|max_file_size|accept}`, `onSubmit(message: {text, files})`), `PromptInputProvider` (lifts state), `PromptInputBody`, `PromptInputHeader`, `PromptInputTextarea`, `PromptInputFooter`, `PromptInputTools`, `PromptInputButton` (tooltip), `PromptInputActionMenu*`, `PromptInputActionAddAttachments`, `PromptInputActionAddScreenshot`, `PromptInputSelect*` (model picker), `PromptInputHoverCard*`, `PromptInputTabs*`, `PromptInputCommand*` (cmdk), `PromptInputSubmit`. Built on shadcn `InputGroup`.
- Textarea: `field-sizing-content max-h-48 min-h-16`. Enter submits via `form.requestSubmit()` unless `isComposing` (tracked with `compositionstart/end` **and** `nativeEvent.isComposing`) or Shift; skips if the submit button is `disabled`; external `onKeyDown` runs first and can `preventDefault()`. **Backspace in an empty textarea removes the last attachment.** Paste of files → attachments.
- `PromptInputSubmit({status, onStop})`: icon ↵ / spinner (submitted) / ■ (streaming) / ✕ (error); `aria-label` flips "Submit" ↔ "Stop"; `type` flips submit ↔ button.
- `Suggestions`/`Suggestion` (`suggestion.tsx`): horizontal `ScrollArea` of Buttons, `onClick(suggestion)`; no roving focus. `Conversation` uses `role="log"`.
- No Escape handling, no history recall, no keyCode 229 check.

### assistant-ui `ComposerPrimitive` — source: `github.com/assistant-ui/assistant-ui` `packages/react/src/primitives/composer/`; docs https://www.assistant-ui.com/docs/ui/Composer
- Parts: `Root` (form), `Input`, `Send`, `Cancel`, `AddAttachment`, `Attachments`, `AttachmentDropzone`, `Dictate`/`StopDictation`/`DictationTranscript`, `Quote*`, `Queue`, `If`, `Unstable_TriggerPopover*` (slash/@ menus).
- `Input` (react-textarea-autosize): `submitMode: "enter" | "ctrlEnter" | "none"` (default `enter`), `cancelOnEscape = true` (Escape **stops the running generation** when `canCancel`), `unstable_focusOnRunStart = true`, `unstable_focusOnScrollToBottom = true`, `addAttachmentOnPaste = true`, `autoFocus = false`, `unstable_insertNewlineOnTouchEnter` (Enter = newline on touch-primary devices). Cmd/Ctrl+Shift+Enter = "steer" when the thread supports queuing. Enter while running is ignored unless queuing is supported. Ignores `isComposing`; trigger plugins get keys first.
- Trigger popover sets `aria-controls`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-activedescendant` on the textarea (APG combobox with the textarea as the combobox).
- `Send`/`Cancel` are action buttons that disable themselves via runtime state.
- Known bug: Safari fires `compositionend` before the Enter keydown, so `isComposing` is false and the IME-confirm Enter sends — issue https://github.com/assistant-ui/assistant-ui/issues/8199 (and #8319); fix = also check `keyCode === 229`.

### CopilotKit `CopilotChatInput` (v2) — source: `github.com/CopilotKit/CopilotKit` `packages/react-core/src/v2/components/chat/CopilotChatInput.tsx`
- Modes `input | transcribe | processing`; tools menu (`ToolsMenuItem`), mic, `SendButton`, autosize to **5 lines** max (JS `scrollHeight`), `autoFocus`, `isRunning`, `onStop`.
- Keys: returns on `isComposing || keyCode === 229`. Slash menu (`value.startsWith("/")`): ArrowUp/Down move a highlight, Enter picks, Escape closes; `role="listbox"`/`role="option" aria-selected`, but **no `aria-activedescendant`/`aria-controls` on the textarea** (screen readers do not hear the highlight). Enter (no Shift) sends; when running and the box is empty Enter **stops** (comment: a non-empty composer is "unambiguous intent to send"). Refocuses input after send.
- Gap: the icon-only send button has no accessible name (no `aria-label`/sr-only in the file).

### ChatGPT — https://www.ai-toolbox.co/chatgpt-management-and-productivity/chatgpt-keyboard-shortcuts-guide *(3rd-party; app shows the list with Ctrl/⌘+/)*
- Autosizing textarea; "+" menu (files, tools), model/mode pickers, voice, send ↔ stop square.
- Enter send, Shift+Enter newline; **Shift+Esc focuses the chat input**; Ctrl/⌘+Shift+C copy last response; Ctrl/⌘+Shift+O new chat; Ctrl/⌘+/ shortcut dialog.

### Claude.ai — https://fastshortcuts.com/shortcuts/claude/ *(3rd-party)*
- Textarea + attachment/tools menu, model picker, send ↔ stop. Enter send, Shift+Enter newline. Reported: **ArrowUp in an empty input loads the last sent message for editing** (resend branches the conversation). Claude Code (terminal) uses Up/Down history and Esc Esc to edit the previous message: https://code.claude.com/docs/en/interactive-mode

### Gemini — https://fastshortcuts.com/shortcuts/gemini/ *(3rd-party)*
- Ctrl/⌘+Shift+O new chat, Ctrl/⌘+Shift+K search chats, Ctrl+/ shortcut list. Enter/Shift+Enter as above. Tools menu, model switcher, mic, send ↔ stop.

### GitHub Copilot Chat in VS Code — `microsoft/vscode-docs` `docs/chat/chat-overview.md`, `docs/agents/reference/ai-features-cheat-sheet.md`, `docs/configure/accessibility/accessibility.md`
- Enter sends. While a request runs, the Send button has a dropdown: **Add to Queue**, **Steer with Message**, **Stop and Send** (`chat.requestQueuing.defaultAction`, default steer).
- Commands for previous/next user prompt and code block, Find in chat, Open chat view (Ctrl+Alt+I / ⌃⌘I), Quick Chat. **Accessible View** (Alt+F2) reads a chat response line by line; **Accessibility Help** (Alt+F1) is context-aware in the chat view; accessibility signals (sounds + announcements) for chat progress.
- **Lesson:** Up/Down in the chat input walk prompt history when the caret is on the first/last line; this **replaced unsent text** and drew many bug reports: https://github.com/microsoft/vscode/issues/276373, https://github.com/microsoft/vscode/issues/282902, https://github.com/microsoft/vscode-copilot-release/issues/6390. → Only recall history when the composer is **empty**.

### Slack — https://slack.com/help/articles/201374536-Slack-keyboard-shortcuts, https://slack.com/help/articles/115005523006-Set-your-Enter-key-preference
- Enter preference: "Send the message" (Shift+Enter newline) **or** "Start a new line" (⌘/Ctrl+Enter sends). Code blocks switch Enter to newline.
- **ArrowUp in the empty message field edits your last message** (configurable under Preferences → Accessibility). Formatting toolbar, attachments, @mentions / slash commands popovers.

### Cursor — https://cursor.com/docs/reference/keyboard-shortcuts, https://cursor.com/docs/agent/overview
- ⌘L/⌘I toggle the side panel (agent). Enter queues a follow-up while the agent runs; **⌘/Ctrl+Enter sends immediately** (steer). **Escape cancels generation** or unfocuses the input. @ context and / commands popovers.

---

## 3. Keyboard and accessibility checklist

WCAG 2.2 refs: 2.1.1 Keyboard https://www.w3.org/WAI/WCAG22/Understanding/keyboard ·
2.1.2 No Keyboard Trap https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap ·
2.1.4 Character Key Shortcuts https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts ·
2.4.3 Focus Order https://www.w3.org/WAI/WCAG22/Understanding/focus-order ·
2.4.7 Focus Visible https://www.w3.org/WAI/WCAG22/Understanding/focus-visible ·
2.4.11 Focus Not Obscured https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum ·
2.5.3 Label in Name https://www.w3.org/WAI/WCAG22/Understanding/label-in-name ·
3.2.2 On Input https://www.w3.org/WAI/WCAG22/Understanding/on-input ·
3.3.2 Labels or Instructions https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions ·
4.1.3 Status Messages https://www.w3.org/WAI/WCAG22/Understanding/status-messages.

| # | Rule | Why / source |
|---|---|---|
| 1 | **Enter sends, Shift+Enter newline**; also accept ⌘/Ctrl+Enter as send. Offer `submitMode="mod-enter"` (Enter = newline) for long-form inputs. | Universal convention (all products above); Slack and assistant-ui make it configurable. Enter-to-send is an expected textarea exception, documented via the hint (3.3.2). |
| 2 | **Never send during IME composition**: bail on `e.nativeEvent.isComposing || e.keyCode === 229`; same guard for Escape/ArrowUp. | Safari fires `compositionend` before the confirming keydown: assistant-ui #8199/#8319; MDN keydown https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event; https://azukiazusa.dev/blog/ime-enter-submit/. CopilotKit already checks 229. |
| 3 | Plain Enter on **touch-primary** devices inserts a newline (send via button). | Soft keyboards lack Shift+Enter ergonomics; assistant-ui `unstable_insertNewlineOnTouchEnter`. Optional. |
| 4 | **Escape while generating = Stop**; otherwise Escape does nothing to the draft (no clear). A popover open → Escape closes the popover first. | assistant-ui `cancelOnEscape`, Cursor. Clearing a draft on Esc is destructive and unexpected. Never trap focus (2.1.2): Tab always leaves the textarea. |
| 5 | **ArrowUp recalls/edits the last user message only when the composer is empty** (and caret at 0, no modifiers, not composing, no popover). | Slack, Claude.ai. VS Code's first-line variant destroyed drafts (#276373, #282902). Make it opt-in (`onRecallLast`). |
| 6 | A **global "focus composer" shortcut** must use a modifier (Shift+Esc like ChatGPT, or `mod+/`), be registered in the host shortcut registry, and be listed in help. No single-character shortcut like "/" unless it can be turned off or only works when nothing editable is focused. | 2.1.4; Tecton already has `src/tecton/shortcuts.tsx` (`useShortcut`). |
| 7 | **Submit becomes Stop while streaming.** Prefer **two buttons that swap** (Send hidden, Stop shown) with stable names "Send message" / "Stop generating"; keep focus: if the focused Send is replaced, move focus to Stop (and back to the textarea when it ends). Do not flip a single button's `aria-label` in place. Announce "Generating…" / "Stopped" / "Response complete" in a polite status. | Roselli, *Be careful with dynamic accessible names* https://adrianroselli.com/2020/12/be-careful-with-dynamic-accessible-names.html and *Multi-function button* http://adrianroselli.com/2021/01/multi-function-button.html; 4.1.3. (AI Elements flips `aria-label` on one button, which works but is announced unreliably.) |
| 8 | **Don't use native `disabled` on Send**; use `aria-disabled` (still focusable, still named) when empty/busy, and make activation a no-op. Keep the **textarea enabled while streaming** so the user can draft the next message; Enter while busy does nothing (or queues if the app supports it). | MDN aria-disabled https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-disabled; https://kittygiraudel.com/2024/03/29/on-disabled-and-aria-disabled-attributes/. Disabling the textarea drops focus to `<body>` (2.4.3). Upstream examples use `disabled`/`isDisabled`. |
| 9 | **Autosize** with `field-sizing: content` + `max-height` (≈ 8–10 lines, AI Elements `max-h-48`), then scroll; JS fallback where `field-sizing` is unsupported. Keep the composer from covering the focused transcript item. | 2.4.11; resize reflow 1.4.10. Tecton `textarea` already has `field-sizing-content`. |
| 10 | **Label**: visible or `aria-label` ("Message" / "Ask Tecton"); placeholder is not a label. Keyboard hint ("Enter to send, Shift+Enter for a new line") via `aria-describedby`, visible hint optional (Kbd). Icon buttons get names that match tooltips. | GOV.UK *Patterns for accessible webchats* https://accessibility.blog.gov.uk/2016/12/09/patterns-for-accessible-webchats/; 3.3.2, 2.5.3. |
| 11 | **Announce new assistant messages** through the transcript `role="log"` (polite, `aria-relevant="additions"`), set `aria-busy` on it while a turn streams so the complete message is read once; never put `aria-live` on the element receiving tokens. Composer owns only a small status region for state transitions and errors. | shadcn `message-scroller.mdx` §Accessibility; https://accessibility.build/guides/accessible-ai-chat; Craig Abbott https://craigabbott.co.uk/blog/web-chat-accessibility-considerations; Sara Soueidan live regions https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/; Roselli *Live Region Support* (2026) http://adrianroselli.com/2026/01/live-region-support.html (support is uneven; test). |
| 12 | **Focus stays in the textarea after send** (clear it, keep caret). Do not move focus to the new message. After Stop, return focus to the textarea if it was on Stop. | GOV.UK webchat findings (focus jumping is the top complaint); assistant-ui `focusOnRunStart`; CopilotKit refocus. 2.4.3, 3.2.2 (sending must not change context unexpectedly). |
| 13 | **Suggestion chips**: real buttons; group as `Toolbar` (one Tab stop, Arrow keys move) or a plain list of buttons if few. Selecting a chip fills the textarea (or sends, if labelled "Send: …") and focuses the textarea. | APG Toolbar https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/; RAC `Toolbar`. AI Elements/CopilotKit chips are plain buttons (N Tab stops). |
| 14 | **Attachments** as a removable list: RAC `TagGroup` with `onRemove` gives Delete/Backspace removal on the focused chip, arrow navigation, and a localized "Press Delete to remove" description; each chip also has a visible remove button (`aria-label="Remove report.pdf"`). Backspace in an **empty** textarea removing the last attachment (AI Elements) is a nice-to-have but must be announced. Announce "report.pdf attached / removed". | `react-aria/dist/private/tag/useTag.mjs` (Delete, Backspace, `removeDescription`); upstream `attachment-states.tsx` labels "Remove …". 4.1.3. |
| 15 | **Slash commands / @ mentions** = APG combobox with the textarea as combobox: `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`, `aria-activedescendant` for the highlighted option (focus stays in the textarea); Up/Down move, Enter/Tab pick, Escape closes (without stopping generation). | APG Combobox https://www.w3.org/WAI/ARIA/apg/patterns/combobox/; assistant-ui trigger popover does this; CopilotKit lacks activedescendant. RAC 1.21 `Autocomplete` / `TokenField` (see §4). |
| 16 | **Paste / drop files** → attachments (with `accept`, `maxFiles`, `maxFileSize`, error announcement); an explicit "Attach files" button (`FileTrigger`) so it's keyboard-reachable; drop zone is never the only path. | AI Elements `globalDrop`/`onError`; assistant-ui `addAttachmentOnPaste`; RAC `DropZone`/`FileTrigger`. 2.1.1. |
| 17 | **Screen-reader hints**: announce errors ("Message failed to send. Retry") in `role="alert"` or the status region; provide a way to review the last response as plain text (VS Code Accessible View idea) — out of scope for the composer, but keep a "copy last response" action reachable. | VS Code `accessibility.md`; ChatGPT ⌘⇧C. |
| 18 | Focus ring on the whole `InputGroup` (`:focus-within`) plus on each toolbar button. | 2.4.7; already how shadcn `input-group` styles `has-[:focus-visible]`. |

---

## 4. Recommendation for Tecton

Location: `packages/tecton-react/src/tecton/composer.tsx` (Tecton-specific; `data-slot`, `cva`, `cn` from
"cn", RAC primitives, `onPress`). Compose from the generated `InputGroup`, `InputGroupTextarea`,
`InputGroupAddon`, `InputGroupButton`, `Attachment`, `Kbd`, `Tooltip`. No overlay change needed.

### Parts and API

```tsx
type ComposerStatus = "ready" | "submitted" | "streaming" | "error"   // AI SDK ChatStatus shape

<Composer                              // RAC <Form> (role implicit) + context; data-slot="composer"
  value / defaultValue / onValueChange // controlled or uncontrolled text
  onSubmit={(msg: { text: string; files: File[] }) => void}
  onStop={() => void}
  status={ComposerStatus}
  submitMode="enter" | "mod-enter"     // default "enter"; Shift+Enter always newline
  onRecallLast?={() => string | void}  // enables ArrowUp-in-empty; returns text to load
  isDisabled?                          // whole composer (e.g. no permission); rare
  accept? maxFiles? maxFileSize? onFileError?
>
  <ComposerAttachments />              // RAC TagGroup + TagList of Attachment; onRemove (Delete/Backspace)
  <ComposerInput                       // RAC TextArea inside InputGroup; field-sizing + maxRows
    aria-label="Message"  placeholder="Ask about this well…"  maxRows={8} />
  <ComposerToolbar>                    // RAC Toolbar (arrow-key roving), InputGroupAddon align="block-end"
    <ComposerAttach />                 // FileTrigger + InputGroupButton "Attach files"
    {/* app slots: model Select, mode ToggleButton, DropdownMenu… */}
    <ComposerSubmit />                 // renders Send (type=submit) or Stop (onPress→onStop) by status
  </ComposerToolbar>
  <ComposerHint />                     // "Enter to send · Shift+Enter new line" with Kbd; id → aria-describedby
  <ComposerStatusMessage />            // visually hidden role="status": Generating… / Stopped / Error
</Composer>

<ComposerSuggestions onSelect={(text) => …}>   // RAC Toolbar of Buttons; above/below the composer
  <ComposerSuggestion>Summarise the last shift report</ComposerSuggestion>
</ComposerSuggestions>

useComposer()  // { value, setValue, files, addFiles, removeFile, submit, stop, focus, status }
```

Behaviour contract:
- Submit = trimmed text or ≥1 file, `status === "ready" | "error"`; clears value and files, focus stays in `ComposerInput`.
- `ComposerSubmit`: two buttons that swap, names "Send message" / "Stop generating", `aria-disabled` (not `disabled`) when empty; if focus was on the swapped button, move it to the replacement; spinner while `submitted` (Stop still available).
- Textarea is **never** disabled during `submitted/streaming`; Enter is a no-op then (no queueing in v1).
- `ComposerStatusMessage` announces transitions only; the transcript (`MessageScrollerContent`, `role="log"`, `aria-busy` while streaming) announces messages. Document this pairing in the docs page.
- Global focus shortcut: `useShortcut("shift+escape", focus)` via Tecton `ShortcutsProvider` (opt-in prop `focusShortcut`), shown in shell help.

### Keyboard map (v1)

| Context | Key | Action |
|---|---|---|
| Textarea | Enter | Send (`submitMode="enter"`); newline in `mod-enter` mode |
| Textarea | Shift+Enter | Newline (always) |
| Textarea | ⌘/Ctrl+Enter | Send (both modes) |
| Textarea | any key with `isComposing` or `keyCode 229` | Ignored by composer (IME owns it) |
| Textarea, streaming | Escape | Stop generation, announce "Stopped" |
| Textarea, idle | Escape | Nothing (propagates, e.g. to close a Sheet/panel) |
| Textarea, empty, caret 0 | ArrowUp | `onRecallLast()` loads last user message (only if provided) |
| Textarea, empty, attachments | Backspace | Nothing in v1 (avoid silent removal); use the chip |
| Toolbar / Suggestions | ←/→, Home/End | Move between buttons (one Tab stop each) |
| Attachment chip | Delete / Backspace | Remove, announce, focus next chip or textarea |
| Anywhere in host | Shift+Esc (configurable) | Focus composer textarea |
| Everywhere | Tab / Shift+Tab | Leaves composer normally (no trap) |

### Leave out of v1
- Slash commands and @ mentions (combobox, `aria-activedescendant`). For v2 evaluate RAC 1.21
  `TokenField` (Tecton already has `react-aria-components@1.21.1`; its doc comment: "Use it to
  build AI prompt fields, tag inputs, … mention inputs"; `onSubmit` fires on `insertParagraph`,
  Shift+Enter is `insertLineBreak`, composition-aware), or RAC `Autocomplete` + `ListBox`.
- Queue / steer while running (VS Code, Cursor, assistant-ui `Queue`) — needs transport support.
- Voice dictation, screenshots, drag-overlay `globalDrop`, rich text / markdown formatting toolbar.
- Model/mode picker as a built-in part (just a toolbar slot with `Select`/`ToggleButton`).
- Backspace-in-empty removes last attachment; touch-Enter-newline heuristic.
- History beyond the last message (Up/Down cycling).

### Things to test
IME (Japanese/Chinese) in Safari + Chrome; VoiceOver/NVDA: send → one announcement of the finished
reply, status transitions, Stop reachable and named while streaming; focus after send/stop; Tab order
Attachments → Textarea → Toolbar → (Suggestions); 200% zoom and 320 px panel width.
