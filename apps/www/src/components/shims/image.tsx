import * as React from "react"

/** Minimal stand-in for `next/image` used by upstream shadcn examples. */
export default function Image({
  src,
  alt,
  fill,
  priority: _priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blur,
  unoptimized: _unoptimized,
  style,
  ...props
}: Omit<React.ComponentProps<"img">, "src" | "placeholder"> & {
  src: string | { src: string }
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: string
  blurDataURL?: string
  unoptimized?: boolean
}) {
  return (
    <img
      src={typeof src === "string" ? src : src.src}
      alt={alt ?? ""}
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...props}
    />
  )
}
