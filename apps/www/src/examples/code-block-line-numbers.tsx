// Synced from shadcn/ui (apps/v4/examples/base/code-block-line-numbers.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { CodeBlock, CodeBlockContent } from "@tecton/react/code-block"

const code = `{
  "name": "chat",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}`

export function CodeBlockLineNumbers() {
  return (
    <div className="w-full max-w-md">
      <CodeBlock>
        <CodeBlockContent lineNumbers>{code}</CodeBlockContent>
      </CodeBlock>
    </div>
  )
}
