import {
  CodeBlocksIcon,
  DataObjectIcon,
  DescriptionIcon,
  PaletteIcon,
  TerminalIcon,
} from "@tecton/react/icons"

/** Small icon for a code block title, keyed by file extension / language. */
export function getIconForLanguageExtension(language: string) {
  switch (language) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
    case "mts":
      return <CodeBlocksIcon />
    case "css":
      return <PaletteIcon />
    case "json":
      return <DataObjectIcon />
    case "bash":
    case "sh":
    case "shell":
      return <TerminalIcon />
    default:
      return <DescriptionIcon />
  }
}
