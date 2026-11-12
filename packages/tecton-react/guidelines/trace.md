---
component: Trace
module: "@tecton/react/trace"
family: conversation
exports: [Trace, TraceLine, TraceIcon, TraceTitle, TraceDescription, TraceCollapsible, TraceCollapsibleTrigger, TraceCollapsibleContent]
notFor:
  - need: the reply text of an assistant turn
    use: Message
  - need: a list of steps the user works through
    use: Item
  - need: a section that hides and reveals arbitrary content
    use: Collapsible
related: [Message, Marker, CodeBlock]
---

## Use it when

- Showing what an assistant or an automated job did on the way to its answer: reasoning, tool calls, sources, plan steps.
- Each step fits on one line, and some of them can expand into their output or detail.
- A step is running, has failed or has not started yet, and the reader should see which.

## Do

- Put every step in a `TraceLine` inside `Trace`, with a `TraceIcon`, a `TraceTitle` and, for a count or a duration, a `TraceDescription` after the title.
- Set `status` on `TraceLine` (`"running"`, `"error"`, `"pending"`) and write the title to match: "Running the simulation", "Failed to load the well log", "Load the survey".
- To expand a step, wrap its `TraceLine` in `TraceCollapsibleTrigger` inside `TraceCollapsible` and put the detail in `TraceCollapsibleContent`; to link it, wrap it in an `a` or a `Link`.
- Nest a `Trace` inside `TraceCollapsibleContent` when a summary step expands into its own steps.

## Don't

### HIGH A clickable step built from a div

Wrong:

```tsx
<Trace>
  <div onClick={() => setOpen(!open)}>
    <TraceLine>
      <TraceTitle>Ran the pressure model</TraceTitle>
    </TraceLine>
  </div>
  {open && <pre>{output}</pre>}
</Trace>
```

Correct:

```tsx
<Trace>
  <TraceCollapsible>
    <TraceCollapsibleTrigger>
      <TraceLine>
        <TraceTitle>Ran the pressure model</TraceTitle>
      </TraceLine>
    </TraceCollapsibleTrigger>
    <TraceCollapsibleContent>{output}</TraceCollapsibleContent>
  </TraceCollapsible>
</Trace>
```

A `div` takes no keyboard focus and announces no expanded state, so the step's output is out of reach without a mouse; the trigger adds the chevron, the focus ring and `aria-expanded`.

### MEDIUM Colouring a failed step by hand

Wrong:

```tsx
<TraceLine className="text-destructive">
  <TraceTitle>Failed to load the well log</TraceTitle>
</TraceLine>
```

Correct:

```tsx
<TraceLine status="error">
  <TraceTitle>Failed to load the well log</TraceTitle>
</TraceLine>
```

`status` sets `data-status`, which a wrapping collapsible trigger reads to colour its chevron too and which keeps the error colour on hover; a class colours the text and nothing else.