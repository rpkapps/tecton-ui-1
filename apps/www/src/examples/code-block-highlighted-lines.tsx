// Synced from shadcn/ui (apps/v4/examples/base/code-block-highlighted-lines.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockLine,
} from "@tecton/react/code-block"

const code = `export default {
  experimental: {
    reactCompiler: true,
    viewTransition: true,
  },
  images: {
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }],
  },
}`

const highlighted = [2, 3]

export function CodeBlockHighlightedLines() {
  return (
    <div className="w-full max-w-md">
      <CodeBlock>
        <CodeBlockContent lineNumbers>
          {code.split("\n").map((line, index) => (
            <CodeBlockLine
              key={index}
              variant={highlighted.includes(index) ? "highlighted" : "default"}
            >
              {line}
            </CodeBlockLine>
          ))}
        </CodeBlockContent>
      </CodeBlock>
    </div>
  )
}
